<#
.SYNOPSIS
    Sync your Mobarrez Code fork with upstream sst/opencode.

.DESCRIPTION
    A safe one-command sync of your fork (origin) with the upstream opencode
    repository. Steps:

      1. Refuse to start if the working tree is dirty.
      2. Fetch upstream (read-only - never touches your branches).
      3. Show how many commits you'd pull, and exit early if already up to date.
      4. Tag a rollback point.
      5. Merge upstream/dev into your dev branch (no rebase, no force).
      6. Auto-resolve a small frozen list of rebranded docs in your favor
         (--ours) so Persian copy, AGENTS.md, and DEVELOPMENT.md stay yours.
      7. Stop and print exact fix commands if any OTHER conflict remains.
      8. Rebuild (bun install, then typecheck and lint unless -NoLintTest).

    Never rebases. Never force-pushes. Never auto-resolves code conflicts.
    Rollback with:  git reset --hard pre-sync-<timestamp>

.PARAMETER DryRun
    Fetch and report divergence only. Do not merge and do not tag.

.PARAMETER NoLintTest
    Skip bun install / typecheck / lint after a clean merge.

.PARAMETER ShowFrozenOnly
    Print the frozen-files list and exit. No git operations.

.PARAMETER UpstreamRemote
    Remote name to sync from. Default: upstream

.PARAMETER UpstreamBranch
    Branch on the upstream remote to sync from. Default: dev

.PARAMETER LocalBranch
    Local branch to sync into. Default: dev

.EXAMPLE
    powershell.exe -ExecutionPolicy Bypass -File ./script/sync-upstream.ps1
    Run the full sync.

.EXAMPLE
    pwsh ./script/sync-upstream.ps1 -DryRun
    See what would change without touching anything.

.EXAMPLE
    pwsh ./script/sync-upstream.ps1 -ShowFrozenOnly
    Print the files that will be auto-kept on conflict.
#>
[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$NoLintTest,
    [switch]$ShowFrozenOnly,
    [string]$UpstreamRemote = "upstream",
    [string]$UpstreamBranch = "dev",
    [string]$LocalBranch = "dev"
)

$ErrorActionPreference = "Stop"

$FrozenFiles = @(
    "README.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "AGENTS.md",
    "github/README.md",
    "packages/desktop/README.md",
    "packages/opencode/README.md",
    "DEVELOPMENT.md",
    "mobarrez-code-build-plan.md"
)

function Write-Section($text) { Write-Host "`n$text" -ForegroundColor Cyan }
function Write-OK($text)      { Write-Host $text -ForegroundColor Green }
function Write-Warn2($text)   { Write-Host $text -ForegroundColor Yellow }
function Write-Dim($text)     { Write-Host $text -ForegroundColor DarkGray }
function Die($text)          { Write-Host $text -ForegroundColor Red; exit 1 }

function Assert-CleanTree {
    $dirty = git status --porcelain 2>&1
    if ($LASTEXITCODE -ne 0) { Die "git status failed:`n$dirty" }
    if (-not [string]::IsNullOrWhiteSpace($dirty)) {
        Die "Working tree is dirty. Commit or stash first:`n$dirty"
    }
}

function Assert-RepoRoot {
    $toplevel = git rev-parse --show-toplevel 2>&1
    if ($LASTEXITCODE -ne 0) { Die "Not inside a git repository." }
    Set-Location -LiteralPath $toplevel
}

function Get-UnmergedFiles {
    $u = git diff --name-only --diff-filter=U 2>&1
    if ($LASTEXITCODE -ne 0) { return @() }
    $u -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ }
}

Assert-RepoRoot

if ($ShowFrozenOnly) {
    Write-Section "Frozen files (auto-kept --ours on conflict):"
    foreach ($f in $FrozenFiles) { Write-Host "  $f" }
    exit 0
}

Assert-CleanTree

Write-Section "Fetching $UpstreamRemote/$UpstreamBranch ..."
$fetchOut = git fetch $UpstreamRemote --prune 2>&1
if ($LASTEXITCODE -ne 0) { Die "git fetch failed:`n$fetchOut" }
Write-Host $fetchOut

$upstream = "$UpstreamRemote/$UpstreamBranch"
$countsLine = git rev-list --left-right --count "$LocalBranch...$upstream" 2>&1
if ($LASTEXITCODE -ne 0) { Die "Could not compute divergence. Does $upstream exist?`n$countsLine" }
$parts = $countsLine -split '\s+' | Where-Object { $_ }
$ahead = [int]$parts[0]
$behind = [int]$parts[1]

Write-Section "Divergence:"
Write-Host "  $LocalBranch is $ahead ahead, $behind behind $upstream"

if ($behind -eq 0) {
    Write-OK "Already up to date. Nothing to sync."
    exit 0
}

Write-Section "Commits to pull:"
git log --oneline "$LocalBranch..$upstream" 2>&1 | ForEach-Object { Write-Host "  $_" }

Write-Section "Files that differ:"
git diff --stat "$LocalBranch...$upstream" 2>&1 | ForEach-Object { Write-Host "  $_" }

if ($DryRun) {
    Write-Warn2 "`nDry run - not merging. Remove -DryRun to sync."
    exit 0
}

$rollbackTag = "pre-sync-$(Get-Date -Format yyyyMMdd-HHmmss)"
git tag $rollbackTag 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Die "Failed to create rollback tag $rollbackTag" }
Write-Section "Rollback tag created:"
Write-OK "  $rollbackTag"
Write-Dim "  undo with:  git reset --hard $rollbackTag"

Write-Section "Merging $upstream into $LocalBranch ..."
$mergeOut = git merge $upstream --no-edit 2>&1
$mergeCode = $LASTEXITCODE
Write-Host ($mergeOut -join "`n")

$autoKept = @()
foreach ($f in $FrozenFiles) {
    $status = git status --porcelain -- $f 2>&1
    if ($LASTEXITCODE -eq 0 -and $status -match '^(UU|AA|DD|AU|UA|DU|UD)') {
        git checkout --ours -- $f 2>&1 | Out-Null
        git add -- $f 2>&1 | Out-Null
        $autoKept += $f
    }
}

if ($autoKept.Count -gt 0) {
    Write-Section "Kept your version on conflict (--ours):"
    foreach ($f in $autoKept) { Write-OK "  $f" }
}

$remaining = Get-UnmergedFiles
if ($remaining.Count -gt 0) {
    Write-Warn2 "`nConflicts remain in these files - resolve manually:"
    foreach ($f in $remaining) { Write-Host "  $f" }
    Write-Section "For package.json / bun.lock, recommended:"
    Write-Dim "  git checkout --theirs -- package.json packages/opencode/package.json bun.lock"
    Write-Dim "  bun install"
    Write-Dim "  (then re-run your @opencode-ai/* scope-rename script)"
    Write-Dim "  git add <resolved files>"
    Write-Dim "  git commit --no-edit"
    Write-Dim "  pwsh ./script/sync-upstream.ps1 -NoLintTest"
    exit 1
}

if ($mergeCode -ne 0 -and $autoKept.Count -gt 0) {
    git commit --no-edit 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn2 "Auto-resolved frozen files but `git commit` did not complete. Run `git status`."
        exit 1
    }
}

Write-OK "Merge complete."

if (-not $NoLintTest) {
    Write-Section "bun install ..."
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        bun install 2>&1 | ForEach-Object { Write-Host "  $_" }
    } else {
        Write-Warn2 "  bun not on PATH - skipped"
    }

    if (Get-Command bun -ErrorAction SilentlyContinue) {
        Write-Section "bun run typecheck ..."
        bun run typecheck 2>&1 | ForEach-Object { Write-Host "  $_" }
        if ($LASTEXITCODE -eq 0) { Write-OK "  typecheck: ok" }
        else { Write-Warn2 "  typecheck: failed (exit $LASTEXITCODE) - resolve before pushing" }

        Write-Section "bun run lint ..."
        $lintOut = bun run lint 2>&1
        $lintOut | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" }
        if ($LASTEXITCODE -eq 0) { Write-OK "  lint: ok" }
        else { Write-Warn2 "  lint: non-zero (known pre-existing warnings exist) - review before pushing" }
    }
}

Write-Section "----------------  summary  ----------------"
Write-Host "  Rollback tag : $rollbackTag"
Write-Host "  Auto-kept    : $($autoKept.Count) file(s)"
foreach ($f in $autoKept) { Write-Host "                  - $f" }
Write-Host "  Next         : git show HEAD   (review the merge commit)"
Write-Dim "                re-apply scope rename if package.json changed"
Write-Dim "                then:  git push origin $LocalBranch"
Write-Section "-------------------------------------------"