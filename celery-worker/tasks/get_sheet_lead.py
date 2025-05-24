import re
from celery_app import app
import requests
import json
import os
import datetime
import logging
import socket
import time

from urllib.parse import urljoin
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.errors import HttpError

from utils.dbUtils import *
from utils.googleUtil import *
from utils.normalizedLeadData import *
from tasks.base_tasks_handler import BaseTaskHandler


@app.task(name="tasks.getSheetLead", bind=True, max_retries=3)
def get_sheet_lead(self, message):
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    logger.info(f"Get sheet ...")

    try:
        # Extract the connection ID from db
        sheet = message
        print(f"sheet: {sheet}")
        conn = get_user_calendar_conn(sheet, sheet["connection"])
        tokens = conn["tokens"]

        # # Create credentials and build service
        credentials = create_credentials(tokens)
        service = build('sheets', 'v4', credentials=credentials, cache_discovery=False)
        socket.setdefaulttimeout(30)  # 30 seconds timeout

        leads = process_sheet(extract_sheet_id(sheet.get("sheetUrl", "")), service)
        refresh_tokens_if_needed(credentials, tokens, sheet, sheet["connection"])

        ids = add_leads(leads, sheet["userId"], sheet["flowId"], sheet["nodeId"])
        # Convert ObjectId to string to make it JSON serializable
        id_strings = [str(obj_id) for obj_id in ids]
        time.sleep(3)
        if not id_strings:
            return {'status': True, 'data': "No new leads."}
        response = requests.post("http://127.0.0.1:3001/api/lead/publish", json={
            "userId": str(sheet['userId']),
            "leadIds": id_strings,
            "result": None,
            "isRetry": False,
        })
        response_data = response.json()
        message = f"Response: {response_data.get('statusCode', 200)} - {response_data.get('message', 'No message')}"

        return {'status': True, 'data': message}
    except Exception as e:
        logger.error(f"Failed when get lead from sheet: {str(e)}")
        if self.request.retries < self.max_retries:
            countdown = 5  # Retry after 5 seconds
            raise self.retry(exc=e, countdown=countdown)
        raise


def process_sheet(sheet_id, service):
    """Process a specific sheet to get new leads."""
    range_name = 'Sheet1!A1:Z1000'  # Specify both start and end cells
    try:
        data = get_sheet_data(sheet_id, range_name, service)
        # Extract new rows
        new_leads = data
    except HttpError as error:
        # If the default sheet name fails, try getting sheet names first
        sheets_metadata = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
        sheet_title = sheets_metadata['sheets'][0]['properties']['title']
        range_name = f"'{sheet_title}'!A1:Z1000"  # Use actual sheet name
        data = get_sheet_data(sheet_id, range_name, service)
        new_leads = data

    if new_leads:
        formatted_leads = []
        new_leads[0] = normalize_lead(new_leads[0])
        for lead in new_leads[1:]:
            formatted_lead = {}
            for label, value in zip(new_leads[0], lead):
                formatted_lead[label] = value

            formatted_leads.append(formatted_lead)
        return formatted_leads


def extract_sheet_id(sheet_url):
    """Extract the sheet ID from the URL."""
    match = re.search(r'/d/([a-zA-Z0-9-_]+)', sheet_url)
    if match:
        return match.group(1)
    else:
        raise ValueError("Invalid Google Sheets URL")


def get_sheet_data(sheet_id, range_name, service):
    """Fetch data from Google Sheets."""
    sheet = service.spreadsheets()
    result = sheet.values().get(spreadsheetId=sheet_id, range=range_name).execute()
    return result.get('values', [])


def add_leads(leads, userId, flowId, nodeId):
    print(f"Adding leads...")

    leadObjects = []
    for lead in leads:
        leadObject = {
            "userId": ObjectId(userId),
            "flowId": ObjectId(flowId),
            "status": 1,
            "isVerified": {
                "status": 0,
                "message": ""
            },
            "source": "google sheet",
            "leadData": lead,
            "nodeId": nodeId,
            "error": {
                "status": False,
                "message": "",
                "stackTrace": "",
                "retryCount": 0
            },
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now()
        }
        leadObjects.append(leadObject)
    return add_many_leads(leadObjects)
