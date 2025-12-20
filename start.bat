@echo off
REM =============================================================================
REM GigaChad GRC - One-Command Start (Windows)
REM =============================================================================
REM
REM USAGE:
REM   start.bat         Start all services
REM   start.bat stop    Stop all services
REM   start.bat logs    View logs
REM   start.bat status  Check service status
REM
REM REQUIREMENTS:
REM   - Docker Desktop installed and running
REM
REM =============================================================================

setlocal enabledelayedexpansion

REM Colors (limited in Windows CMD)
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "CYAN=[96m"
set "RED=[91m"
set "NC=[0m"

REM Get script directory
cd /d "%~dp0"

if "%1"=="" goto start
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="logs" goto logs
if "%1"=="status" goto status
goto usage

:banner
echo.
echo %CYAN%===============================================================%NC%
echo %CYAN%                                                               %NC%
echo %CYAN%   GigaChad GRC                                                %NC%
echo %CYAN%                                                               %NC%
echo %CYAN%===============================================================%NC%
echo.
goto :eof

:check_docker
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%ERROR: Docker is not installed.%NC%
    echo.
    echo Please install Docker Desktop:
    echo   https://www.docker.com/products/docker-desktop
    echo.
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%ERROR: Docker is not running.%NC%
    echo.
    echo Please start Docker Desktop and try again.
    echo.
    exit /b 1
)
goto :eof

:start
call :banner
call :check_docker

echo %BLUE%Starting GigaChad GRC...%NC%
echo.
echo This may take a few minutes on first run while Docker builds the images.
echo.

docker compose up -d --build

echo.
echo %GREEN%===============================================================%NC%
echo %GREEN%                                                               %NC%
echo %GREEN%   GigaChad GRC is Starting!                                   %NC%
echo %GREEN%                                                               %NC%
echo %GREEN%===============================================================%NC%
echo.
echo Access Points:
echo    Frontend        http://localhost:3000
echo    API Docs        http://localhost:3001/api/docs
echo    Keycloak        http://localhost:8080 (admin/admin)
echo    Grafana         http://localhost:3003 (admin/admin)
echo.
echo How to Login:
echo    1. Go to http://localhost:3000
echo    2. Click the "Dev Login" button
echo    3. You're in! No password needed.
echo.
echo %YELLOW%Note:%NC% First startup takes 2-3 minutes for database initialization.
echo.
echo Commands:
echo    start.bat stop    Stop all services
echo    start.bat logs    View logs
echo    start.bat status  Check service status
echo.

REM Open browser after delay
echo %YELLOW%Opening browser in 10 seconds...%NC%
timeout /t 10 /nobreak >nul
start http://localhost:3000
goto :eof

:stop
call :banner
echo %YELLOW%Stopping GigaChad GRC...%NC%
docker compose down
echo %GREEN%All services stopped%NC%
echo.
goto :eof

:logs
docker compose logs -f
goto :eof

:status
call :banner
echo Service Status:
echo.
docker compose ps
echo.
goto :eof

:usage
echo Usage: start.bat [start^|stop^|logs^|status]
echo.
echo Commands:
echo   start   Start all services (default)
echo   stop    Stop all services
echo   logs    View service logs
echo   status  Check service status
exit /b 1
