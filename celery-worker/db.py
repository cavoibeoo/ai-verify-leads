from pymongo import MongoClient
from config import Config
import certifi
import os

# Singleton pattern to reuse the connection
_client = None


def get_mongo_client():
    global _client
    if _client is None:
        mongo_uri = Config.MONGO_URI
        if not mongo_uri:
            raise ValueError("MONGO_URI environment variable not found")
        try:
            _client = MongoClient(mongo_uri, tls=True, tlsCAFile=certifi.where())
            # Check if connection is successful by issuing a simple command
            _client.admin.command('ping')
            print("MongoDB connection established successfully")
        except Exception as e:
            print(f"MongoDB connection failed: {e}")
            _client = None
            raise

    return _client
