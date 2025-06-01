from celery_app import app
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.errors import HttpError
from config import Config
import json
import requests
import socket
import time as time_module
import datetime
from datetime import timedelta, time, timezone
import re

from tasks.base_tasks_handler import BaseTaskHandler
from utils.dbUtils import *
from utils.calendarTimeUtil import *
from utils.googleUtil import *


def extract_sheet_id(sheet_url):
    match = re.search(r'/d/([a-zA-Z0-9-_]+)', sheet_url)
    if match:
        return match.group(1)
    else:
        raise ValueError("Invalid Google Sheets URL")


@app.task(name="tasks.exportSheetLead", base=BaseTaskHandler, bind=True, max_retries=3)
def export_sheet_lead(self, message):
    try:
        print(f"Received message {message} ...")

        # Extract the connection ID from db
        settings = get_node_settings(message)
        conn = get_user_calendar_conn(message, settings["connection"])
        tokens = conn["tokens"]
        lead = get_lead(message)

        # Create credentials and build service
        credentials = create_credentials(tokens)
        service = build('sheets', 'v4', credentials=credentials, cache_discovery=False)
        socket.setdefaulttimeout(30)

        # Cleanup and update
        refresh_tokens_if_needed(credentials, tokens, message, settings["connection"])

        # Get sheet ID from settings
        sheet_url = settings.get("sheetUrl")
        if not sheet_url:
            raise ValueError("No sheetUrl found in node settings.")
        sheet_id = extract_sheet_id(sheet_url)

        lead_data = lead.get("leadData", {})
        if not lead_data:
            raise ValueError("No leadData found in lead.")

        sheetName = settings.get("sheetName", "Sheet1")

        # Get headers from the sheet (first row)
        range_name = f'{sheetName}!A1:Z1'
        try:
            result = service.spreadsheets().values().get(spreadsheetId=sheet_id, range=range_name).execute()
            headers = result.get('values', [[]])[0]
            if not headers:
                headers = list(lead_data.keys())
                service.spreadsheets().values().update(
                    spreadsheetId=sheet_id,
                    range=f'{sheetName}!A1',
                    valueInputOption="USER_ENTERED",
                    body={"values": [headers]}
                ).execute()
        except Exception as e:
            print(f"Error getting headers: {e}")
            headers = list(lead_data.keys())
            service.spreadsheets().values().update(
                spreadsheetId=sheet_id,
                range=f'{sheetName}!A1',
                valueInputOption="USER_ENTERED",
                body={"values": [headers]}
            ).execute()

        # Prepare row in the same order as headers
        row = [lead_data.get(h, "") for h in headers]

        append_range = f'{sheetName}'

        # Append data row
        service.spreadsheets().values().append(
            spreadsheetId=sheet_id,
            range=append_range,
            valueInputOption="USER_ENTERED",
            insertDataOption="INSERT_ROWS",
            body={"values": [row]}
        ).execute()

        return {"status": "success", "result": "true"}

    except (socket.timeout, socket.error, TimeoutError, ConnectionError, HttpError) as e:
        countdown = 2 ** self.request.retries
        raise self.retry(exc=e, countdown=countdown)

    except Exception as e:
        print(f"Error exporting lead to sheet: {e}\n")
        if self.request.retries < self.max_retries:
            countdown = 5
            raise self.retry(exc=e, countdown=countdown)
        raise
