@echo off
echo Run calendar worker
echo.

echo Activating virtual environment...
call celery-env\Scripts\activate.bat

echo Installing requirements...
pip install -r requirements.txt
echo.

echo Starting Celery worker...
celery -A celery_app worker --queues=googleCalendar.consumer --loglevel=info --pool=gevent --concurrency=5 --hostname=googleCalendarWorker@%%h

pause