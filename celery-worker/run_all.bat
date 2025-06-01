@echo off
REM Launching all Celery workers except run_beat, run_get_sheets, run_get_sheet_lead

echo Launching all Celery workers...

start "aiCall Worker" cmd /k call run_ai_worker.bat
start "Calendar Worker" cmd /k call run_calendar_worker.bat
start "Export Sheet Worker" cmd /k call run_export_sheet.bat
start "Pre Verify Worker" cmd /k call run_pre_verify_worker.bat
start "Webhook Worker" cmd /k call run_webhook_worker.bat

echo All workers launched in separate windows.
pause
