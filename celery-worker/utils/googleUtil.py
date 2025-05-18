from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.errors import HttpError
from config import Config

from utils.dbUtils import *


def create_credentials(tokens):
    """Create Google API credentials."""
    return Credentials(
        tokens['access_token'],
        refresh_token=tokens['refresh_token'],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET
    )


def refresh_tokens_if_needed(credentials, tokens, message, connection):
    """Update tokens in the database if they were refreshed."""
    if credentials.token != tokens['access_token']:
        print("Token was refreshed, updating in database...")
        update_tokens(message['userId'], connection, {
            'access_token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'expiry_date': credentials.expiry,
        })
