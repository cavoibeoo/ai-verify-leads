from db import get_mongo_client
from bson import ObjectId
from pymongo import UpdateOne
import datetime
import re


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


def normalize_phone(phone):
    # Simple normalization: keep digits only
    return re.sub(r'\D', '', phone)


def get_deduplication_key(lead_data):
    email = lead_data.get("email", "").strip().lower()
    phone = normalize_phone(lead_data.get("phone", ""))
    return email, phone


def lead_data_changed(existing_data, new_data):
    # Compare only relevant fields; can customize as needed
    for key, new_value in new_data.items():
        if existing_data.get(key) != new_value:
            return True
    return False


def add_many_leads(leads_data):
    client = get_mongo_client()
    db = client.get_default_database()
    collection = db["leads"]

    if not leads_data or not isinstance(leads_data, list):
        raise ValueError("leads_data must be a non-empty list")

    bulk_operations = []
    inserted_ids = []

    for lead in leads_data:
        lead_data = lead.get("leadData", {})
        email, phone = get_deduplication_key(lead_data)

        query = {
            "userId": lead.get("userId"),
            "flowId": lead.get("flowId"),
            "$or": [
                {"leadData.email": email},
                {"leadData.phone": phone}
            ]
        }

        existing = collection.find_one(query)

        if existing:
            # Merge logic: update if the existing one is not verified or is old
            should_update = (
                existing.get("status", 0) == 0 or
                lead_data_changed(existing.get("leadData", {}), lead_data)
            )

            if should_update:
                inserted_ids.append(existing["_id"])

                bulk_operations.append(UpdateOne(
                    {"_id": existing["_id"]},
                    {"$set": {
                        "leadData": lead_data,
                        "updatedAt": datetime.datetime.now(),
                        "source": lead.get("source", "unknown"),
                        "nodeId": lead.get("nodeId"),
                        "error": lead.get("error", {}),
                    }}
                ))
        else:
            lead["_id"] = ObjectId()  # assign an ID before insert so we can track it
            inserted_ids.append(lead["_id"])
            bulk_operations.append(lead)

    # Split insert vs update
    inserts = [doc for doc in bulk_operations if not isinstance(doc, UpdateOne)]
    updates = [doc for doc in bulk_operations if isinstance(doc, UpdateOne)]

    if inserts:
        result = collection.insert_many(inserts)

    if updates:
        collection.bulk_write(updates)
    return inserted_ids
