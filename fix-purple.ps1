# PowerShell script to batch replace all purple instances with lime/brand colors

$ErrorActionPreference = "Continue"

Write-Host "Starting purple eradication..." -ForegroundColor Yellow

# Get all TypeScript/TSX files
$files = Get-ChildItem -Path "src" -Include *.tsx,*.ts -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content

    # Purple hex codes
    $content = $content -replace '#8b5cf6', '#C4F82A'
    $content = $content -replace '#a855f7', '#D4FF5E'
    $content = $content -replace '#7c3aed', '#A8D622'
    $content = $content -replace '#c084fc', '#E0FF8A'

    # Slate backgrounds
    $content = $content -replace '#0f172a', '#050505'

    # Purple Tailwind classes with opacity
    $content = $content -replace 'bg-purple-(\d+)/(\d+)', 'bg-[var(--orb-purple)]/$2'
    $content = $content -replace 'text-purple-(\d+)/(\d+)', 'text-brand-accent/$2'
    $content = $content -replace 'border-purple-(\d+)/(\d+)', 'border-[var(--orb-purple)]/$2'
    $content = $content -replace 'hover:bg-purple-(\d+)/(\d+)', 'hover:bg-[var(--orb-purple)]/$2'
    $content = $content -replace 'shadow-purple-(\d+)/(\d+)', 'shadow-[var(--orb-glow)]'
    $content = $content -replace 'ring-purple-(\d+)/(\d+)', 'ring-brand-accent/$2'
    $content = $content -replace 'focus:ring-purple-(\d+)/(\d+)', 'focus:ring-brand-accent/$2'

    # Purple Tailwind classes without opacity
    $content = $content -replace 'bg-purple-(\d+)([^/])', 'bg-brand-accent$2'
    $content = $content -replace 'text-purple-(\d+)([^/])', 'text-brand-accent$2'
    $content = $content -replace 'border-purple-(\d+)([^/])', 'border-brand-accent$2'
    $content = $content -replace 'from-purple-(\d+)', 'from-brand-accent'
    $content = $content -replace 'to-purple-(\d+)', 'to-[#A8D622]'
    $content = $content -replace 'hover:bg-purple-(\d+)([^/])', 'hover:bg-brand-accent$2'
    $content = $content -replace 'hover:text-purple-(\d+)', 'hover:text-brand-accent'
    $content = $content -replace 'hover:border-purple-(\d+)', 'hover:border-brand-accent'
    $content = $content -replace 'focus:border-purple-(\d+)', 'focus:border-brand-accent'
    $content = $content -replace 'focus:ring-purple-(\d+)([^/])', 'focus:ring-brand-accent$2'
    $content = $content -replace 'ring-purple-(\d+)([^/])', 'ring-brand-accent$2'
    $content = $content -replace 'shadow-purple-(\d+)([^/])', 'shadow-[var(--orb-glow)]$2'

    # Pink gradients (companion to purple)
    $content = $content -replace 'to-pink-500', 'to-[#A8D622]'
    $content = $content -replace 'to-pink-600', 'to-[#A8D622]'
    $content = $content -replace 'from-pink-500', 'from-[#A8D622]'

    # Only write if changed
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✓ Processed: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✅ Purple eradication complete!" -ForegroundColor Cyan
