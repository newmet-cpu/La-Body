@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Включите VPN и нажмите любую клавишу...
pause >nul
where py >nul 2>nul && (py download-assets.py) || (python download-assets.py)
echo.
pause
