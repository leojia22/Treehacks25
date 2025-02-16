import logging
import os
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from terra.base_client import Terra
import datetime
import requests
import openai
import json

logging.basicConfig(level=logging.INFO)

_LOGGER = logging.getLogger("app")
app = Flask(__name__)

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Use only Flask-CORS for handling CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173"],  # Add Vite's default port
        "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": "*"
    }
})

# Add response headers for all routes
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

dev_id = '4actk-fitstreak-testing-wfRE9vBU8U'
api_key = 'A-vwB8CGUoNrQvbP0SUM-dD4mABGFq7Z'
@app.route('/authToken', methods=['POST', 'OPTIONS'])
def auth_token():
    print("Received request to /authToken")
    print("Method:", request.method)
    print("Headers:", dict(request.headers))

    if request.method == "OPTIONS":
        # Create a proper response for OPTIONS request
        response = jsonify({"message": "OPTIONS request received"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
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

# Sample Garmin data
SAMPLE_GARMIN_DATA = {
    "data": [{
        "steps": 8500,
        "calories_data": {
            "total_burned_calories": 2100
        },
        "distance_data": {
            "distance_meters": 7500
        }
    }]
}

# Sample sleep data
SAMPLE_SLEEP_DATA = {
    "data": [{
        "measurements_data": {
            "measurements": [
                {
                    "measurement_time": "2025-02-16T04:41:46.102000+00:00",
                    "BMR": 1322,
                    "RMR": 877
                },
                {
                    "measurement_time": "2025-02-16T07:41:46.102000+00:00",
                    "BMR": 1021,
                    "RMR": 1200
                },
                {
                    "measurement_time": "2025-02-16T13:41:46.102000+00:00",
                    "BMR": 1175,
                    "RMR": 1064
                }
            ]
        }
    }]
}

# Sample body data
SAMPLE_BODY_DATA = {
    "data": [{
        "measurements_data": {
            "measurements": [
                {
                    "measurement_time": "2025-02-16T04:41:46.102000+00:00",
                    "BMR": 1322,
                    "RMR": 877,
                    "lean_mass_g": 37.19,
                    "bone_mass_g": 10.11,
                    "BMI": 16.87,
                    "weight_kg": 45.31,
                    "bodyfat_percentage": 19.05,
                    "water_percentage": 24.38,
                    "muscle_mass_g": 17.43,
                    "height_cm": 196.62
                },
                {
                    "measurement_time": "2025-02-16T07:41:46.102000+00:00",
                    "BMR": 1021,
                    "RMR": 1200,
                    "lean_mass_g": 34.86,
                    "bone_mass_g": 12.87,
                    "BMI": 39.66,
                    "weight_kg": 77.74,
                    "bodyfat_percentage": 74.66,
                    "water_percentage": 69.28,
                    "muscle_mass_g": 40.30,
                    "height_cm": 174.47
                }
            ]
        }
    }]
}

@app.route('/analyze_garmin_data', methods=['GET'])
def analyze_garmin_data():
    try:
        # Get data from sample
        data = SAMPLE_GARMIN_DATA['data'][0]
        
        # Calculate metrics
        steps = data.get('steps', 0)
        calories = data.get('calories_data', {}).get('total_burned_calories', 0)
        distance = data.get('distance_data', {}).get('distance_meters', 0) / 1000  # Convert to km
        
        # Determine activity level based on steps
        activity_level = "Low" if steps < 5000 else "Moderate" if steps < 10000 else "High"
        
        # Prepare analysis prompt
        analysis_prompt = f"""
        Based on the following Garmin fitness data:
        Steps: {steps}
        Calories Burned: {calories}
        Distance: {distance:.1f} km
        Activity Level: {activity_level}
        
        Give recommendations and insights based on this data. Give both as a neat, concise, and presentable summary paragraph.
        Also, suggest specific daily goals:
        - Daily distance target in km
        - Active time in minutes
        - Calories to burn
        Make these goals realistic and based on the user's current performance.
        """

        # Get AI analysis
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a fitness expert providing evidence-based recommendations."},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=0.7
        )

        # Get the content and ensure it's clean text
        analysis = response.choices[0].message.content.strip()
        
        # Extract suggested goals using regex
        distance_match = re.search(r'(\d+(?:\.\d+)?)\s*km', analysis.lower())
        time_match = re.search(r'(\d+)\s*minutes?', analysis.lower())
        calories_match = re.search(r'(\d+)\s*calories?', analysis.lower())
        
        suggested_goals = {
            "distance": {"value": float(distance_match.group(1)) if distance_match else 5.0, "unit": "km"},
            "time": {"value": int(time_match.group(1)) if time_match else 30, "unit": "min"},
            "calories": {"value": int(calories_match.group(1)) if calories_match else 300, "unit": "cal"}
        }
        
        return jsonify({
            "status": "success",
            "analysis": analysis,
            "insights": [
                f"Activity Level: {activity_level}",
                f"Daily Steps: {steps:,}",
                f"Calories Burned: {calories:,} kcal",
                f"Distance: {distance:.1f} km"
            ],
            "suggested_goals": suggested_goals
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/analyze_sleep_patterns', methods=['GET'])
def analyze_sleep_patterns():
    try:
        # Get measurements from sample data
        measurements = SAMPLE_SLEEP_DATA['data'][0]['measurements_data']['measurements']
        
        # Calculate sleep metrics
        bmr_values = [m['BMR'] for m in measurements]
        rmr_values = [m['RMR'] for m in measurements]
        
        avg_bmr = sum(bmr_values) / len(bmr_values)
        avg_rmr = sum(rmr_values) / len(rmr_values)
        bmr_change = max(bmr_values) - min(bmr_values)
        
        # Determine sleep quality
        sleep_quality = "Good" if bmr_change < 300 else "Fair" if bmr_change < 500 else "Poor"
        
        # Prepare analysis prompt
        analysis_prompt = f"""
        As a sleep expert, analyze this user's sleep patterns:
        
        Average BMR: {avg_bmr:.0f}
        Average RMR: {avg_rmr:.0f}
        BMR Variation: {bmr_change:.0f}
        Sleep Quality: {sleep_quality}
        
        Please provide:
        1. Overall sleep quality assessment
        2. Specific recommendations for improvement
        3. Health insights based on these metrics
        
        Give recommendations and insights based on this data. Give both as a neat, concise, and presentable summary paragraph.
        """

        # Get AI analysis
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert fitness trainer and health coach."},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=0.7
        )

        # Get the content and ensure it's clean text
        ai_response = response.choices[0].message.content.strip()
        
        # Return formatted response
        return jsonify({
            "recommendation": "Sleep Analysis Results: " + ai_response,
            "insights": [
                f"Sleep Quality: {sleep_quality}",
                f"Average BMR: {avg_bmr:.0f}",
                f"Average RMR: {avg_rmr:.0f}",
                f"BMR Variation: {bmr_change:.0f}"
            ]
        })

    except Exception as e:
        app.logger.error(f"Error analyzing sleep data: {str(e)}")
        return jsonify({
            "error": "Failed to analyze sleep data",
            "message": str(e)
        }), 500

@app.route('/analyze_body_composition', methods=['GET'])
def analyze_body_composition():
    try:
        # Get the latest measurement
        measurements = SAMPLE_BODY_DATA['data'][0]['measurements_data']['measurements']
        latest_measurement = measurements[0]  # Most recent measurement
        
        # Calculate trends
        trends = {
            'weight': [m['weight_kg'] for m in measurements],
            'bodyfat': [m['bodyfat_percentage'] for m in measurements],
            'muscle_mass': [m['muscle_mass_g'] for m in measurements],
            'water': [m['water_percentage'] for m in measurements]
        }
        
        # Calculate changes
        changes = {
            'weight': trends['weight'][0] - trends['weight'][-1],
            'bodyfat': trends['bodyfat'][0] - trends['bodyfat'][-1],
            'muscle_mass': trends['muscle_mass'][0] - trends['muscle_mass'][-1],
            'water': trends['water'][0] - trends['water'][-1]
        }
        
        # Prepare analysis prompt
        analysis_prompt = f"""
        As a body composition expert, analyze this user's measurements:
        
        Current Metrics:
        - BMI: {latest_measurement['BMI']:.1f}
        - Weight: {latest_measurement['weight_kg']:.1f} kg
        - Body Fat: {latest_measurement['bodyfat_percentage']:.1f}%
        - Muscle Mass: {latest_measurement['muscle_mass_g']:.1f}g
        - Water: {latest_measurement['water_percentage']:.1f}%
        
        Recent Changes:
        - Weight: {changes['weight']:.1f} kg
        - Body Fat: {changes['bodyfat']:.1f}%
        - Muscle Mass: {changes['muscle_mass']:.1f}g
        - Water: {changes['water']:.1f}%
        
Give recommendations and insights based on this data. Give both as a neat, concise, and presentable summary paragraph.
        """

        # Get AI analysis
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert fitness trainer and health coach."},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=0.7
        )

        # Get the content and ensure it's clean text
        ai_response = response.choices[0].message.content.strip()
        
        # Return formatted response
        return jsonify({
            "recommendation": ai_response,
            "insights": [
                f"BMI: {latest_measurement['BMI']:.1f} ({get_bmi_category(latest_measurement['BMI'])})",
                f"Body Fat: {latest_measurement['bodyfat_percentage']:.1f}% ({get_bodyfat_category(latest_measurement['bodyfat_percentage'])})",
                f"Muscle Mass: {latest_measurement['muscle_mass_g']:.1f}g",
                f"Water: {latest_measurement['water_percentage']:.1f}%",
                f"Weight Change: {changes['weight']:+.1f} kg",
                f"Body Fat Change: {changes['bodyfat']:+.1f}%"
            ]
        })

    except Exception as e:
        app.logger.error(f"Error analyzing body composition: {str(e)}")
        return jsonify({
            "error": "Failed to analyze body composition",
            "message": str(e)
        }), 500

def get_bmi_category(bmi):
    if bmi < 18.5:
        return "underweight"
    elif bmi < 25:
        return "healthy weight"
    elif bmi < 30:
        return "overweight"
    else:
        return "obese"

def get_bodyfat_category(bf_percentage):
    if bf_percentage < 6:
        return "essential fat"
    elif bf_percentage < 14:
        return "athletes"
    elif bf_percentage < 18:
        return "fitness"
    elif bf_percentage < 25:
        return "average"
    else:
        return "above average"

if __name__ == '__main__':
    app.run(debug=True, port=5002)
