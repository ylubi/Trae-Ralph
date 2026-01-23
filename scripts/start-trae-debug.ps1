# Trae 调试模式启动脚本 (PowerShell)
# 开启远程调试端口 9222

Write-Host "🚀 启动 Trae (调试模式)..." -ForegroundColor Cyan
Write-Host ""

# 从配置文件读取 Trae 路径
if (Test-Path "trae-config.json") {
    $config = Get-Content "trae-config.json" | ConvertFrom-Json
    $traePath = $config.traePath
    $port = $config.port
    
    Write-Host "✅ 使用配置文件中的路径" -ForegroundColor Green
    Write-Host "   路径: $traePath" -ForegroundColor Gray
    Write-Host "   端口: $port" -ForegroundColor Gray
    Write-Host ""
    
    # 启动 Trae
    & $traePath --remote-debugging-port=$port
    
} else {
    Write-Host "❌ 未找到配置文件" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先运行: node config.js" -ForegroundColor Yellow
    Write-Host ""
    pause
}
