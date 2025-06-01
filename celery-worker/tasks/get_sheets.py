import re
from celery_app import app
import requests
import json
import os
import datetime
import logging
import socket

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
from tasks.get_sheet_lead import get_sheet_lead


@app.task(name="tasks.getSheets", bind=True, max_retries=3)
def get_sheets(self):
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    logger.info(f"Get sheet ...")

    try:
        # Extract the connection ID from db
        requiredSheet = get_required_sheets()

        for sheet in requiredSheet:
            print(f"Dispatch {sheet} to worker: ")
            # For each required sheet, dispatch it to the get_sheet_lead task
            get_sheet_lead.delay(
                message={
                    "sheetUrl": sheet["sheetUrl"],
                    "connection": sheet["connection"],
                    "userId": str(sheet["userId"]),
                    "flowId": str(sheet["flowId"]),
                    "nodeId": str(sheet["nodeId"]),
                    "sheetName": sheet.get("sheetName")
                }
            )
        return {'status': True, 'data': f"Dispatched {len(requiredSheet)} sheets to worker."}
    except Exception as e:
        logger.error(f"Failed when get lead from sheet: {str(e)}")
        if self.request.retries < self.max_retries:
            countdown = 5  # Retry after 5 seconds
            raise self.retry(exc=e, countdown=countdown)
        raise


def get_required_sheets():
    requiredSheets = []
    flows = list(get_active_flows())
    print(f"flows: {len(flows)}")
    for flow in flows:
        nodes = flow["nodeData"]["nodes"]
        for node in nodes:
            if node["type"] == "getSheetLead":
                settings = node["data"]["settings"]
                sheetName = settings.get("sheetName", "Sheet1")
                sheetUrl = settings.get("sheetUrl")
                connection = settings.get("connection")
                if sheetUrl and connection:
                    requiredSheets.append(
                        {"sheetUrl": sheetUrl, "connection": connection,
                         "userId": flow["userId"], "flowId": flow["_id"], "nodeId": node["id"],
                         "sheetName": sheetName})
    return requiredSheets
