@echo off
REM Trae 调试模式启动脚本
REM 开启远程调试端口 9222

echo 🚀 启动 Trae (调试模式)...
echo.

REM 从配置文件读取 Trae 路径
if exist trae-config.json (
    echo ✅ 使用配置文件中的路径
) else (
    echo ❌ 未找到配置文件
    echo 请先运行: node config.js
    pause
    exit /b 1
)

REM 启动 Trae
"D:\Program Files (x86)\trae\Trae\Trae.exe" --remote-debugging-port=9222

pause
