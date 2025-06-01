from celery import Celery
from config import Config
import ssl
import certifi

app = Celery(
    "lead_verifier",
    broker=Config.RABBITMQ_URL,  # Use RabbitMQ as the broker
    broker_use_ssl={
        'ca_certs': certifi.where(),
        'cert_reqs': ssl.CERT_REQUIRED
    }
)

app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_routes={
        'tasks.aiCall': {'queue': 'aiCall.consumer'},
        'tasks.preVerify': {'queue': 'preVerify.consumer'},
        'tasks.sendWebhook': {'queue': 'sendWebhook.consumer'},
        'tasks.googleCalendar': {'queue': 'googleCalendar.consumer'},
        'tasks.getSheets': {'queue': 'getSheets.consumer'},
        'tasks.getSheetLead': {'queue': 'getSheetLead.consumer'},
        'tasks.exportSheetLead': {'queue': 'exportSheetLead.consumer'},
    },
    broker_connection_timeout=10,
    broker_heartbeat=10  # Adjust heartbeat interval
)
# Configure periodic taskss
app.conf.beat_schedule = {
    'get-sheet-leads-every-5-minutes': {
        'task': 'tasks.getSheets',
        'schedule': 900.0,  # 15 minutes in seconds
        'options': {'queue': 'getSheets.consumer'},
    },
}


def _import_tasks():
    import tasks.ai_call
    import tasks.pre_verify
    import tasks.send_webhook
    import tasks.google_calendar
    import tasks.get_sheet_lead
    import tasks.get_sheets
    import tasks.export_sheet_lead


_import_tasks()
