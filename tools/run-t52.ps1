#Requires -Version 5.1
<#
.SYNOPSIS
  Run one T52 bot pilot with a single shell approval instead of many.
.DESCRIPTION
  Approval/sandbox rights cannot be stored in this repo: they live in the
  session's approval policy (changeable mid-session) and in the launch flags
  (--disable-approval, --disable-sandbox, --yolo, fixed at launch, need a
  restart to change). This script does the next best thing: it collapses the
  recurring pilot workflow (run + outcome + log tail) into ONE fixed command
  line, so it costs one prompt instead of one per step.
.EXAMPLE
  powershell -File tools/run-t52.ps1 -Seed t52-warrior-20 -Class 0 -Actions 1500
#>
param(
  [string]$Seed = 't52-warrior-auto',
  [int]$Class = 0,
  [int]$Actions = 1500
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

& node tools/scratch/t52-bot2.mjs $Seed $Class $Actions
Write-Output '--- log tail ---'
Get-Content "tools/scratch/t52-logs/$Seed.jsonl" -Tail 5
