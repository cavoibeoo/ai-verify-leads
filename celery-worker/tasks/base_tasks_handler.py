from celery import Task

from utils.dbUtils import *
import traceback
import requests

# Map node names to human-readable descriptions
NODE_TASK_NAMES = {
    "tasks.preVerify": "Pre-verify",
    "tasks.aiCall": "Lead call",
    "tasks.googleCalendar": "Google Calendar",
    "tasks.sendWebhook": "Send webhook",
}


class BaseTaskHandler(Task):
    def before_start(self, task_id, args, kwargs):
        message = kwargs["message"]
        update_lead_status_and_current_node(message['leadId'], 2, message["targetNode"])

    def on_success(self, retval, task_id, args, kwargs):
        data = kwargs["message"]
        flow = get_flow(data)
        routes = flow["routeData"]
        is_not_finished = any(route["source"] == data["targetNode"] for route in routes)

        if is_not_finished:
            if "aiCall" not in self.name:
                update_lead_status_and_current_node(data['leadId'], 3, data["targetNode"])
                if retval.get("isPublish", False):
                    response = requests.post("http://127.0.0.1:3001/api/lead/publish", json={
                        "userId": data['userId'],
                        "leadIds": [data['leadId']],
                        "result": retval["result"],
                        "isRetry": False,
                    })
                    print(f"Publish lead to next node... {response.json()}")

            print(f"Task {self.name} succeeded. Flow continue.")
            print("-" * 50)  # Print a horizontal line of 50 dashes
        else:
            if "aiCall" not in self.name:
                update_lead_status_and_current_node(data['leadId'], 9, data["targetNode"])
            print(f"Task {self.name} succeeded. Flow finished.")

        super().on_success(retval, task_id, args, kwargs)

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        # Log the error or perform any other failure handling logic
        print(f"Task {self.name} failed: {exc}")
        # print(f"Task ID: {task_id}")
        # print(f"Arguments: {args}")
        # print(f"Keyword Arguments: {kwargs}")
        tb_string = ''.join(traceback.format_exception(
            type(exc),
            exc,
            exc.__traceback__
        ))

        print("")

        data = kwargs["message"]
        update_field = {
            "status": 0,
            "error": {
                "status": True,
                "message": (f"Task {NODE_TASK_NAMES.get(f'{self.name}')} occurred an error when executing."),
                "taskId": task_id,
                "stackTrace": tb_string[:5000]
            },
        }

        update_lead(data['leadId'], update_field)
        super().on_failure(exc, task_id, args, kwargs, einfo)
