param(
    [Parameter(Mandatory=$true)]
    [string]$mensaje
)

Write-Host "`n>> git add -A" -ForegroundColor Cyan
git add -A

Write-Host "`n>> git commit" -ForegroundColor Cyan
git commit -m $mensaje

Write-Host "`n>> git push" -ForegroundColor Cyan
git push

Write-Host "`n>> git status" -ForegroundColor Cyan
git status

Write-Host "`n>> git log (ultimos 5)" -ForegroundColor Cyan
git log --oneline -5
