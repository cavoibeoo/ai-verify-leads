from celery_app import app
from db import get_mongo_client
from utils.dbUtils import *
import requests
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

from config import Config
from tasks.base_tasks_handler import BaseTaskHandler


def make_post_request(url, json_data):
    """Make a POST request and return the response data"""
    print(f"Making POST request to {url}.")
    response = requests.post(
        url=url,
        json=json_data,
        headers={'Content-Type': 'application/json'}
    )
    response.raise_for_status()  # Raise an error for bad responses
    return response.json()


def check_url(url):
    headers = {
        "Authorization": f"Bearer {Config.OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": Config.OPENAI_MODEL,
        "messages": [
            {
                "role": "system",
                "content": """
                            You are a content safety analysis assistant. You will verify 
                            the validity of URLs and determine if they contain any sensitive content. 
                            Return the content in JSON with the format:
                            {
                                "isValid": true/false, 
                                "reason": "tell the specific reason in less than 10 words"
                            }
                        """
            },
            {
                "role": "user",
                "content": f"Check the following URL: {url}."
            }
        ]
    }

    print("Sending request to OpenAI API for URL check.")
    response = requests.post(
        "https://api.openai.com/v1/chat/completions", headers=headers, json=data)

    if response.status_code == 200:
        return json.loads(response.json()["choices"][0]["message"]["content"])
    else:
        return f"Error: {response.status_code} - {response.text}"


@app.task(name="tasks.preVerify", base=BaseTaskHandler, bind=True, max_retries=3)
def pre_verify(self, message):
    try:
        print(f"Received message: {message}")

        # Get required data
        settings = get_node_settings(message)
        lead = get_lead(message)

        # Validate criteria exists
        criteria = settings.get("criteria")
        if not criteria:
            print("No criteria found in settings.")
            raise ValueError("No criteria found in settings.")

        # Prepare request payloads
        verify_field_body = {
            "leadData": json.dumps(lead['leadData']),
            "criteriaField": json.dumps(criteria),
        }

        # website_url = lead['leadData']['custom_fields'].get('website_link')
        website_url = lead['leadData'].get('website_link')
        scrape_body = {
            "url": website_url,
            "promptCriteria": settings.get('webScrapingPrompt', ''),
        }

        # Initialize response containers
        field_response = {"pass": False}
        scrape_response = {"pass": True}

        # Using ThreadPoolExecutor to run requests concurrently
        with ThreadPoolExecutor() as executor:
            futures = []

            # Always submit field verification request
            field_verify_future = executor.submit(
                make_post_request,
                "http://127.0.0.1:5000/preverify",
                verify_field_body
            )
            futures.append(field_verify_future)

            # Only process website if URL exists
            scrape_future = None
            if settings.get("enableWebScraping"):
                # Validate URL first
                check_result = check_url(website_url)
                print(f"Check URL API: {check_result}")

                if not check_result.get("isValid", False):
                    # Update lead with invalid URL status
                    update_lead(
                        lead['_id'],
                        {
                            "isVerified": {
                                "status": 1,
                                "message": f"Invalid URL: {check_result.get('reason', 'Unknown error')}"
                            },
                        }
                    )
                    return {'isPublish': True, 'result': False,
                            "reason": check_result.get("reason", "Invalid URL")}

                # URL is valid, submit scraping request
                scrape_future = executor.submit(
                    make_post_request,
                    "http://127.0.0.1:5000/scrape",
                    scrape_body
                )
                futures.append(scrape_future)

            # Wait for all requests to complete
            for future in as_completed(futures):
                if future == field_verify_future:
                    field_response = future.result()
                elif future == scrape_future:
                    scrape_response = future.result()

        # Log responses for debugging
        print(f"Field verify API: {field_response}")
        print(f"Response from web scrapingAPI: {scrape_response}")

        if (field_response.get('pass', False) is False):
            reason = ''
            for criteria in field_response.get('criteria_results', []):
                if criteria.get('passed', False) is False:
                    reason += f"{criteria.get('reason', '')}\n"
            # Update lead with valid status
            print(f"Field verification failed: {reason}")
            update_lead(
                lead['_id'],
                {
                    "isVerified": {
                        "status": 1,
                        "message": reason
                    },
                }
            )
        # Return True only if both checks pass
        return {"result":  field_response.get('pass', False) and scrape_response.get('pass', True),
                "isPublish": True, }

    except Exception as e:
        print(f"Error in pre_verify task: {str(e)}")
        if self.request.retries < self.max_retries:
            countdown = 5 * (self.request.retries + 1)  # Exponential backoff
            raise self.retry(exc=e, countdown=countdown)
        raise  # Re-raise if max retries exceeded
