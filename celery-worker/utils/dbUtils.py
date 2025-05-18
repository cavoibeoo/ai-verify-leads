from db import get_mongo_client
from bson import ObjectId


def get_flow(message):
    client = get_mongo_client()
    db = client.get_default_database()
    collection = db["flows"]

    flow = collection.find_one({"_id": ObjectId(message['flowId'])})
    if not flow:
        raise ValueError(f"Flow with ID {message.get('flowId')} not found.")

    return flow


def get_active_flows():
    client = get_mongo_client()
    db = client.get_default_database()
    collection = db["flows"]

    active_flows = collection.find({"status": 2})
    if not active_flows:
        raise ValueError("No active flows found.")

    return active_flows


def get_lead(message):
    client = get_mongo_client()
    db = client.get_default_database()
    collection = db["leads"]

    lead = collection.find_one({"_id": ObjectId(message['leadId'])})
    if not lead:
        raise ValueError(f"Lead with ID {message.get('leadId')} not found.")

    return lead


def get_node_settings(message):
    client = get_mongo_client()
    db = client.get_default_database()
    collection = db["flows"]

    flow = collection.find_one({"_id": ObjectId(message['flowId'])})
    if not flow:
        raise ValueError(f"Flow with ID {message.get('flowId')} not found.")

    nodes = flow["nodeData"]["nodes"]
    settings = {}
    for node in nodes:
        if node["id"] == message["targetNode"]:
            node_data = node
            settings = node_data["data"]["settings"]
            # print (f"questions: {settings}")
            break
    else:
        raise ValueError(f"Node with ID {message.get('nodeId')} not found.")

    return settings


def get_user_calendar_conn(message, connectionId):
    client = get_mongo_client()
    db = client.get_default_database()
    collection = db["users"]

    user = collection.find_one({"_id": ObjectId(message['userId'])})
    if not user:
        raise ValueError(f"User with ID {message.get('userId')} not found.")

    connections = user["calendarConnection"]
    conn = {}
    for connection in connections:
        if connection["profile"]["id"] == connectionId:
            conn = connection
            # print (f"settings: {conn}")
            break

    return conn


def update_tokens(userId, connectionId, tokens):
    client = get_mongo_client()
    db = client.get_default_database()
    collection = db["users"]

    user = collection.find_one({"_id": ObjectId(userId)})
    if not user:
        raise ValueError(f"User with ID {userId} not found.")

    connections = user["calendarConnection"]
    for connection in connections:
        if connection["profile"]["id"] == connectionId:
            connection["tokens"]["access_token"] = tokens["access_token"]
            connection["tokens"]["refresh_token"] = tokens["refresh_token"]
            connection["tokens"]["expiry_date"] = tokens["expiry_date"]
            break

    collection.update_one({"_id": ObjectId(userId)}, {"$set": {"calendarConnection": connections}})


def update_lead_status_and_current_node(leadId, status, currentNode):
    client = get_mongo_client()
    db = client.get_default_database()
    collection = db["leads"]

    lead = collection.find_one({"_id": ObjectId(leadId)})
    if not lead:
        raise ValueError(f"Lead with ID {leadId} not found.")

    collection.update_one({"_id": ObjectId(leadId)}, {"$set": {"status": status, 'nodeId': currentNode}})


def update_lead(leadId, data):
    client = get_mongo_client()
    db = client.get_default_database()
    collection = db["leads"]

    lead = collection.find_one({"_id": ObjectId(leadId)})
    if not lead:
        raise ValueError(f"Lead with ID {leadId} not found.")

    update_fields = {}
    for key, value in data.items():
        update_fields[key] = value

    collection.update_one({"_id": ObjectId(leadId)}, {"$set": update_fields})


def add_many_leads(leads_data):
    """
    Add multiple leads to the database.

    Args:
        leads_data (list): A list of dictionaries containing lead data.

    Returns:
        list: A list of inserted document IDs.
    """
    client = get_mongo_client()
    db = client.get_default_database()
    collection = db["leads"]

    if not leads_data or not isinstance(leads_data, list):
        raise ValueError("leads_data must be a non-empty list")

    result = collection.insert_many(leads_data)
    return result.inserted_ids
