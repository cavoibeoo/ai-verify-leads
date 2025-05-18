# First, install cerberus if not installed: pip install cerberus
from config import Config
import requests
import json


def normalize_lead(fields):
    headers = {
        "Authorization": f"Bearer {Config.OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": Config.OPENAI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": """You are an expert at mapping lead field names to standardized fields.
                Map the input field names exactly to these canonical fields where appropriate:
                \n\nfull_name, email, phone, job_title, company_name, website_link, address, industry, company_size.
                \n\nIf a field clearly matches one of these, output the canonical field name. Only fall back to simplified 
                snake_case when no match is possible. Output only a JSON array of mapped field names like this: [\"full_name\", \"email\", ...] 
                """
            },
            {
                "role": "user",
                "content": f"Map the following lead information fields: {fields}."
            },
        ],
        "temperature": 0.1
    }

    print("Sending fields to OpenAI API for normalize fields...")
    response = requests.post(
        "https://api.openai.com/v1/chat/completions", headers=headers, json=data)

    if response.status_code == 200:
        print(response.json()["choices"][0]["message"]["content"])
        content = response.json()["choices"][0]["message"]["content"]
        # Convert the JSON string to a Python list
        try:
            normalized_fields = json.loads(content)
            return normalized_fields
        except json.JSONDecodeError:
            # In case the response isn't properly formatted JSON
            return content
    else:
        return f"Error: {response.status_code} - {response.text}"
