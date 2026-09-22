"""Quick CLI to talk to the coordination server from a shell (handy for a
Claude Code session to call via Bash instead of writing Python each time).

Talks to the server's raw REST API directly (`POST /runs`) rather than
through `acp_sdk.client.Client`: that class's `run_sync` currently sends a
malformed body against this server/SDK version pairing (a real acp-sdk
bug, not this script's own encoding - confirmed by the same request
working fine over plain curl). Swap to the SDK client once that's fixed
upstream or pinned to a working version pair.

Usage:
  uv run ACP_client.py whoami "<family>"   # client attaches a UUID and
                                          # refuses replies that don't echo it
  uv run ACP_client.py post "<session-name>: <TAG> <message>"  # compact, see below
  uv run ACP_client.py inbox [N | #N | since <iso-time> | <session> | from <session>]
  uv run ACP_client.py resolve "#N[: <note>]"
  uv run ACP_client.py request "<session>: <task>"
  uv run ACP_client.py requests [all]
  uv run ACP_client.py done "<session>: #R[: <note>]"
  uv run ACP_client.py claim "<session>: <scope>[: <note>]"
  uv run ACP_client.py release "<session>: <scope>"
  uv run ACP_client.py locks [all]
  uv run ACP_client.py status
  uv run ACP_client.py heartbeat "<session-name>[: <status>]"
  uv run ACP_client.py presence [N | all]
  uv run ACP_client.py poll [session]  # inbox-since-last-poll + open requests + claims
  uv run ACP_client.py echo "<text>"      # quickstart sanity check

Polling convention: a session with nothing else to do checks `poll`
about every five minutes - the server has no push channel, so polling
is the only way requests, claims and messages get picked up.

Compact posts (ACP #862/#864): `post` is checked before sending and
refused (exit 1, nothing sent) unless it reads `<session>: <TAG> ...` -
a session name before the first colon (the server takes that as the
sender), then a status tag T D B Q H R W V (optional /<char> suffix),
then a body of at most $ACP_MAX_POST chars (default 300). Cite #N,
@sha, file:line instead of restating context.

Failures: transport errors (server down, wrong port, timeout) are
retried with backoff, then reported loudly on stderr with a
port/server checklist and exit code 2. Nothing lands in the shared
mailbox on failure, so check stderr - not the mailbox - when a post
seems lost.
"""

import json
import os
import re
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import httpx

# Mailbox content is UTF-8 (✓/→/emoji appear in audit posts); Windows
# consoles default to cp1252, which crashes poll/inbox printing. Force
# UTF-8 so the sync commands work without a PYTHONIOENCODING override.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
del _stream

# Default matches ACP_server.py's actual bound port (1337: 8000/8100 are
# commonly taken by other dev tools) - override with ACP_BASE_URL if the
# server is run on a different port.
BASE_URL = os.environ.get("ACP_BASE_URL", "http://localhost:1337")

# Transport retries: a refused localhost connection at startup or a
# dropped socket is usually transient, and a coordination message that
# never lands is otherwise invisible (nothing appears in the shared
# mailbox). Backoff doubles per attempt: ~0.5s, ~1s, ~2s.
MAX_ATTEMPTS = 3
BACKOFF_BASE_SECONDS = 0.5


TAGS = "TDBQHRWV"
MAX_POST_CHARS = int(os.environ.get("ACP_MAX_POST", "300"))
# A session name is one token (`claude-02`, `opencode-session`) - no
# spaces or slashes, and not a bare status tag - so a post that leads
# with its tag (`D/x: ...`) is caught instead of being filed under a
# sender named "D/x".
SESSION_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.-]*")
TAG_RE = re.compile(rf"[{TAGS}](/\S)?(\s|$)")


def lint_post(text: str) -> str | None:
    """Why a post breaks the compact protocol, or None if it is fine."""
    sender, sep, body = text.partition(":")
    sender, body = sender.strip(), body.strip()
    if not sep or not SESSION_RE.fullmatch(sender) or TAG_RE.fullmatch(sender):
        return (
            f"no session prefix (sender would be {sender!r}) - "
            'write "<session>: <TAG> <message>", e.g. "claude-02: D @abc123 ok:tests"'
        )
    if not TAG_RE.match(body):
        return f"body must start with a status tag ({' '.join(TAGS)}), e.g. \"{sender}: T #66 ...\""
    if len(body) > MAX_POST_CHARS:
        return (
            f"body is {len(body)} chars (max {MAX_POST_CHARS}) - trim: cite #N/@sha/file:line "
            "instead of restating context, use ok:/x: gate tokens, or split into two posts"
        )
    return None


class ClientError(RuntimeError):
    """The request never reached the agent - nothing was posted, claimed,
    or read. Carries an actionable hint, not just the socket error."""


def _hint() -> str:
    return (
        f"is the server running? (`uv run ACP_server.py`, expecting {BASE_URL}) - "
        "check `netstat -ano | findstr LISTEN` for its PID, $ACP_BASE_URL, "
        "and README ## Running the server. The message was NOT delivered: "
        "nothing landed in the shared mailbox."
    )


def _cursor_path(session: str) -> Path:
    # Per-session cursor: sessions share this machine and repo dir, so a
    # shared cursor would let one session's poll hide mail from another.
    # Polling only ever reads - nothing is consumed - but each session
    # still tracks its own window.
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in session)
    return Path(__file__).parent / f".poll_cursor_{safe or 'default'}.json"


def call(agent: str, text: str, attempts: int = MAX_ATTEMPTS) -> str:
    """Run one agent and return its reply text. Retries transient
    transport failures (refused/timeout/dropped, HTTP 5xx) with backoff;
    raises ClientError with a server/port checklist after `attempts`
    tries, or immediately on 4xx / malformed replies."""
    body = {
        "agent_name": agent,
        "input": [{"role": "user", "parts": [{"content_type": "text/plain", "content": text}]}],
        "mode": "sync",
    }
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            response = httpx.post(f"{BASE_URL}/runs", json=body, timeout=30.0)
            if response.status_code >= 500:
                raise httpx.HTTPStatusError(
                    f"HTTP {response.status_code} from {BASE_URL}",
                    request=response.request,
                    response=response,
                )
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                raise ClientError(
                    f"ACP {agent} rejected (HTTP {response.status_code}): "
                    f"{response.text[:200]} - {_hint()}"
                ) from e
            try:
                output = response.json()["output"]
            except (ValueError, KeyError, TypeError) as e:
                raise ClientError(
                    f"ACP {agent} got an unexpected reply from {BASE_URL} "
                    f"(HTTP 200 but not an ACP run body: {response.text[:200]}) - "
                    "wrong service on this port? " + _hint()
                ) from e
            chunks = []
            for message in output:
                for part in message["parts"]:
                    chunks.append(part["content"])
            return "\n".join(chunks)
        except (httpx.TransportError, httpx.HTTPStatusError) as e:
            last_error = e
            if attempt < attempts:
                time.sleep(BACKOFF_BASE_SECONDS * 2 ** (attempt - 1))
                continue
            raise ClientError(
                f"ACP {agent} to {BASE_URL} failed after {attempts} attempts "
                f"({last_error}) - {_hint()}"
            ) from e
    raise ClientError(f"ACP {agent}: no attempts made - " + _hint())


def poll(session: str = "") -> None:
    """One-command idle check: new mail since the last poll (or the last
    10 on first run), open requests, active claims. Advances that
    session's cursor."""
    cursor = _cursor_path(session)
    since = None
    if cursor.exists():
        try:
            since = json.loads(cursor.read_text(encoding="utf-8")).get("since")
        except (json.JSONDecodeError, OSError, AttributeError):
            since = None
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    # Cursor advances only on success: a failed poll must not hide mail
    # from the next one (call raises ClientError, skipping the write).
    print(f"=== INBOX ({'since ' + since if since else 'last 10'}) ===")
    print(call("inbox", f"since {since}" if since else "10"))
    print("=== REQUESTS (open) ===")
    print(call("requests", ""))
    print("=== LOCKS ===")
    print(call("locks", ""))
    cursor.write_text(json.dumps({"since": stamp}), encoding="utf-8")


def main(argv: list[str] | None = None) -> None:
    args = sys.argv[1:] if argv is None else argv
    if not args:
        print(__doc__)
        raise SystemExit(1)
    try:
        if args[0] == "poll":
            poll(args[1] if len(args) > 1 else "")
            return
        agent_name = args[0]
        arg_text = args[1] if len(args) > 1 else ""
        if agent_name == "post":
            problem = lint_post(arg_text)
            if problem:
                print(f"ACP REJECTED (nothing sent): {problem}", file=sys.stderr)
                raise SystemExit(1)
        if agent_name == "whoami" and arg_text:
            # Attach a one-off UUID (unless the caller already put one on
            # the line) and refuse any reply that does not echo it back -
            # a name from a mismatched reply must never be adopted.
            tokens = arg_text.split()
            nonce = tokens[-1] if len(tokens) > 1 else ""
            try:
                uuid.UUID(nonce)
            except ValueError:
                nonce = str(uuid.uuid4())
                arg_text = f"{arg_text} {nonce}"
            reply = call(agent_name, arg_text)
            if nonce not in reply:
                raise ClientError(
                    f"ACP whoami reply did not echo this call's id [{nonce}] "
                    f"(got: {reply[:200]}) - that name is not verified as "
                    "yours, do not use it; retry the whoami call."
                )
            print(reply)
        else:
            print(call(agent_name, arg_text))
    except ClientError as e:
        # Loud on stderr AND non-zero exit: a failed post/claim leaves no
        # trace in the shared mailbox, so the caller's shell must not look
        # like success. Exit 2 = transport failure (1 stays usage error).
        print(f"ACP FAILED: {e}", file=sys.stderr)
        raise SystemExit(2)


if __name__ == "__main__":
    main()
