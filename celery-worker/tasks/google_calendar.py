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
from datetime import datetime, timedelta, time, timezone
import backoff

from tasks.base_tasks_handler import BaseTaskHandler
from utils.dbUtils import *
from utils.calendarTimeUtil import *
from utils.googleUtil import *


@app.task(name="tasks.googleCalendar", base=BaseTaskHandler, bind=True, max_retries=3)
def google_calendar(self, message):
    try:
        print(f"Received message {message} ...")

        # Extract the connection ID from db
        settings = get_node_settings(message)
        conn = get_user_calendar_conn(message, settings["connection"])
        tokens = conn["tokens"]
        lead = get_lead(message)

        # Create credentials and build service
        credentials = create_credentials(tokens)
        service = build('calendar', 'v3', credentials=credentials, cache_discovery=False)
        socket.setdefaulttimeout(30)  # 30 seconds timeout

        # Prepare event parameters
        duration_minute = int(settings.get('duration', 1))
        time_zone = 'UTC'

        # Get busy slots
        busy_slots = get_busy_slots(service)

        # Time conversion for available slots
        start_str = settings["startTime"]
        end_str = settings["endTime"]
        start_hour = datetime.strptime(start_str, "%H:%M") - timedelta(hours=7)
        end_hour = datetime.strptime(end_str, "%H:%M") - timedelta(hours=7)

        # Find available slot
        next_slot = find_nearest_available_slot(busy_slots,
                                                settings["startWorkday"], settings["endWorkday"],
                                                start_hour.time(), end_hour.time(), duration_minute)

        if not next_slot:
            print("No available time slots found.")
            return None

        # Create event body
        start_time_str = next_slot.isoformat()
        end_time_str = (next_slot + timedelta(minutes=duration_minute)).isoformat()
        event_body = build_event_body(settings, lead, start_time_str, end_time_str, time_zone)

        # Insert calendar event
        event = service.events().insert(
            calendarId='primary',
            body=event_body,
            conferenceDataVersion=1
        ).execute()

        calendar_link = event.get('htmlLink')
        meet_link = extract_meet_link(event)

        # Cleanup and update
        refresh_tokens_if_needed(credentials, tokens, message, settings["connection"])

        return {
            'calendar_link': calendar_link,
            'meet_link': meet_link
        }

    except (socket.timeout, socket.error, TimeoutError, ConnectionError, HttpError) as e:
        print(f"Network error in google_calendar task: {e}")
        countdown = 2 ** self.request.retries
        raise self.retry(exc=e, countdown=countdown)

    except Exception as e:
        print(f"Error creating calendar event: {e}\n")
        if self.request.retries < self.max_retries:
            countdown = 5  # Retry after 5 seconds
            raise self.retry(exc=e, countdown=countdown)
        raise


def build_event_body(settings, lead, start_time_str, end_time_str, time_zone):
    """Build the event body for Google Calendar."""
    conference_data = {
        'createRequest': {
            'requestId': f"meet-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            'conferenceSolutionKey': {
                'type': 'hangoutsMeet'
            }
        }
    }
    return {
        'summary': settings.get('eventName', 'No Title'),
        'description': settings.get('description', format_meeting_description(lead["leadData"])),
        'start': {
            'dateTime': start_time_str,
            'timeZone': time_zone,
        },
        'end': {
            'dateTime': end_time_str,
            'timeZone': time_zone,
        },
        'attendees': [
            {'email': lead["leadData"]["email"]},
        ],
        'reminders': {
            'useDefault': True,
        },
        'conferenceData': conference_data
    }


def format_meeting_description(lead_data):
    lines = []

    lines.append("Meeting Details:")
    lines.append(f"Dear {lead_data['full_name']}, this is automatic meet created from Whine.")
    lines.append("\n This is our opportunity to discuss mutual interests and explore potential collaboration.")
    lines.append("Please tell us if you have any questions or need to reschedule.")
    # Add general fields
    for key, value in lead_data.items():
        if key == "transcript":
            continue  # skip transcript
        # if key == "custom_fields":
        #     for custom_key, custom_value in value.items():
        #         pretty_key = custom_key.replace("_", " ").title()
        #         lines.append(f"{pretty_key}: {custom_value}")
        #     continue
        pretty_key = key.replace("_", " ").title()
        lines.append(f"{pretty_key}: {value}")

    return "\n".join(lines)


def extract_meet_link(event):
    """Extract the Google Meet link from the event."""
    if 'conferenceData' in event and 'entryPoints' in event['conferenceData']:
        for entry_point in event['conferenceData']['entryPoints']:
            if entry_point.get('entryPointType') == 'video':
                return entry_point.get('uri')
    return None
