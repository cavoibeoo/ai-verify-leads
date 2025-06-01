@echo off
echo Run crewAi API server
echo.

echo Checking if virtual environment exists...
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate


echo Install required packages
pip install -r requirements.txt

echo.
echo Multi-agents online at http://localhost:5000
echo.
python api_server.py

pause 