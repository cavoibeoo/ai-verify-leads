from flask import Flask, request, jsonify
import os
import sys
import json
import traceback

# Add current path to sys.path for module discovery
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.crewai.transcript_analyze_agent import analyze_transcript
from src.crewai.pre_verify_agent import preverify_lead
from src.crewai.crews.agent_webscraper.agent_webscraper import WebScraper

from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
web_scraper = WebScraper()

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    
    if not data or 'customerPrompt' not in data or 'transcript' not in data:
        return jsonify({
            'error': 'Missing required fields: customerPrompt and transcript'
        }), 400
    
    customer_prompt = data['customerPrompt']
    transcript = data['transcript']
    
    try:
        # Call transcript analysis function
        result = analyze_transcript(customer_prompt, transcript)
        
        # Check if result is JSON with error
        if isinstance(result, dict) and 'error' in result:
            return jsonify(result), 500
        
        # Return successful result
        return jsonify(result)
    except Exception as e:
        # Log detailed error for debugging
        error_traceback = traceback.format_exc()
        print(f"Error analyzing transcript: {str(e)}\n{error_traceback}")
        
        return jsonify({
            'error': 'Failed to analyze transcript',
            'message': str(e)
        }), 500

@app.route('/preverify', methods=['POST'])
def preverify():
    data = request.json

    if not data or 'leadData' not in data:
        return jsonify({'error': 'Missing required field: leadData'}), 400

    # Always expect stringified JSON for both fields
    lead_data_str = data['leadData']
    criteria_field_str = data.get('criteriaField', None)

    try:
        # Parse stringified JSON
        lead_data = json.loads(lead_data_str)
        criteria_field = json.loads(criteria_field_str) if criteria_field_str else None

        # Call lead pre-verification function
        result = preverify_lead(lead_data, criteria_field)

        # Check if result is JSON with error
        if isinstance(result, dict) and 'error' in result:
            return jsonify(result), 500

        return jsonify(result)
    except json.JSONDecodeError as e:
        return jsonify({
            'error': 'Invalid JSON in leadData or criteriaField',
            'message': str(e)
        }), 400
    except Exception as e:
        error_traceback = traceback.format_exc()
        print(f"Error preverifying lead: {str(e)}\n{error_traceback}")
        return jsonify({
            'error': 'Failed to preverify lead',
            'message': str(e)
        }), 500

@app.route('/scrape', methods=['POST'])
def scrape():
    data = request.json
    
    if not data or 'url' not in data or 'promptCriteria' not in data:
        return jsonify({
            'error': 'Missing required fields: url and promptCriteria'
        }), 400
    
    url = data['url']
    prompt_criteria = data['promptCriteria']
    
    try:
        # Call the scraping and analysis function
        result = web_scraper.scrape_and_analyze(url, prompt_criteria)
        
        if hasattr(result, '__dict__'):
            result = result.__dict__
        elif hasattr(result, 'to_dict'):
            result = result.to_dict()
        # Check if result contains error
        if isinstance(result, dict) and 'error' in result:
            return jsonify(result), 500
        
        # Return successful result
        return jsonify(result)
    except Exception as e:
        # Log detailed error for debugging
        error_traceback = traceback.format_exc()
        print(f"Error scraping and analyzing: {str(e)}\n{error_traceback}")
        
        return jsonify({
            'error': 'Failed to scrape and analyze website',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 