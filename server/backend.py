import logging

import flask
from terra.base_client import Terra

from flask import Flask, request, jsonify
from flask_cors import CORS
import os

import datetime
import requests
from openai import OpenAI

logging.basicConfig(level=logging.INFO)

_LOGGER = logging.getLogger("app")
app = flask.Flask(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Use only Flask-CORS for handling CORS
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "x-api-key", "dev-id", "terra-signature"],
        "expose_headers": "*"
    }
})

dev_id = '4actk-fitstreak-testing-wfRE9vBU8U'
api_key = 'A-vwB8CGUoNrQvbP0SUM-dD4mABGFq7Z'
@app.route('/authToken', methods=['POST', 'OPTIONS'])
def auth_token():
    print("Received request to /authToken")
    print("Method:", request.method)
    print("Headers:", dict(request.headers))

    if request.method == "OPTIONS":
        # Create a proper response for OPTIONS request
        response = flask.Response()
        response.status_code = 200  # Explicitly set status to 200 OK
        return response
    
    url = 'https://api.tryterra.co/v2/auth/generateAuthToken'
    
    data = request.get_json()
    print("Received data:", data)
    reference_id = data.get("reference_id")

    headers = {
        "accept": "application/json",
        "x-api-key": api_key,
        "dev-id": dev_id,
        "Content-Type": "application/json"
    }

    payload = {"reference_id": reference_id}

    try:
        response = requests.post(url, json=payload, headers=headers)
        return response.text, 200, {'Content-Type': 'application/json'}  # Let Flask-CORS handle CORS headers
    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500  # Let Flask-CORS handle CORS headers

@app.route('/analyze_garmin_data', methods=['POST'])
def analyze_garmin_data():
    try:
        # Get user_id from request
        user_id = request.json.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        # Get the Terra client
        terra = Terra(api_key=os.getenv('TERRA_API_KEY'))
        
        # Fetch last 24 hours of Garmin data
        end_date = datetime.datetime.now()
        start_date = end_date - datetime.timedelta(days=1)
        
        # Get daily data from Terra
        daily_data = terra.get_daily_data(
            user_id=user_id,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            provider="GARMIN"
        )

        # Format the data for AI analysis
        formatted_data = {
            'steps': daily_data.get('steps', 0),
            'distance': daily_data.get('distance', 0),
            'calories': daily_data.get('calories', 0),
            'heart_rate': daily_data.get('heart_rate', {}),
            'sleep': daily_data.get('sleep', {})
        }

        # Create prompt for AI
        prompt = f"""Analyze the following Garmin fitness data and provide insights:
        Steps: {formatted_data['steps']}
        Distance: {formatted_data['distance']} meters
        Calories: {formatted_data['calories']}
        Heart Rate Data: {formatted_data['heart_rate']}
        Sleep Data: {formatted_data['sleep']}
        
        Please provide:
        1. Overall health assessment
        2. Recommendations for improvement
        3. Any concerning patterns
        """

        # Get AI analysis
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a fitness and health analysis expert."},
                {"role": "user", "content": prompt}
            ]
        )

        # Extract the AI's response
        analysis = response.choices[0].message.content

        return jsonify({
            'raw_data': formatted_data,
            'analysis': analysis
        })

    except Exception as e:
        _LOGGER.error(f"Error analyzing Garmin data: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)
