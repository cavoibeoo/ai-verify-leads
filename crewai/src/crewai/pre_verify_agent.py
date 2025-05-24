#!/usr/bin/env python
from random import randint

from pydantic import BaseModel

from crewai.flow import Flow, listen, start

from src.crewai.crews.preverify_agent.preverify_agent import PreverifyAgent

from dotenv import load_dotenv
import json
import os

load_dotenv()


class PreverifyState(BaseModel):
    lead_raw_data: str = ""
    criteria_field: str = ""

class PreverifyFlow(Flow[PreverifyState]):

    @start()
    def read_lead_data(self):
        print("Reading lead data")
    
    @listen(read_lead_data)
    def process_lead_data(self):
        print("Processing lead data")
        result = (
            PreverifyAgent()
            .crew()
            .kickoff(inputs={"lead_raw_data": self.state.lead_raw_data, "criteria_field": self.state.criteria_field})
        )
        return result



def kickoff():
    preverify_flow = PreverifyFlow()
    preverify_flow.kickoff()


def plot():
    preverify_flow = PreverifyFlow()
    preverify_flow.plot()


def preverify_lead(lead_data, criteria_field=None):
    preverify_flow = PreverifyFlow()
    preverify_flow.state.lead_raw_data = lead_data
    
    if criteria_field:
        if isinstance(criteria_field, list):
            criteria_field = json.dumps(criteria_field)
        preverify_flow.state.criteria_field = criteria_field

    result = preverify_flow.kickoff()
    if hasattr(result, 'raw_output'):
        result_str = result.raw_output
    else:
        result_str = str(result)
        
    try:
        result_json = json.loads(result_str)
        return result_json
        
    except json.JSONDecodeError:
        return {"result": result_str}



if __name__ == "__main__":
    kickoff()
