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

# Sample Garmin data for 2 weeks
SAMPLE_GARMIN_DATA = {
    "data": [
        {
            "steps": 8500,
            "calories_data": {"total_burned_calories": 2100},
            "distance_data": {"distance_meters": 7500},
            "date": "2025-02-15"
        },
        {
            "steps": 9200,
            "calories_data": {"total_burned_calories": 2300},
            "distance_data": {"distance_meters": 8000},
            "date": "2025-02-14"
        },
        {
            "steps": 7800,
            "calories_data": {"total_burned_calories": 1900},
            "distance_data": {"distance_meters": 7000},
            "date": "2025-02-13"
        },
        {
            "steps": 10500,
            "calories_data": {"total_burned_calories": 2500},
            "distance_data": {"distance_meters": 9000},
            "date": "2025-02-12"
        },
        {
            "steps": 6500,
            "calories_data": {"total_burned_calories": 1800},
            "distance_data": {"distance_meters": 6000},
            "date": "2025-02-11"
        },
        {
            "steps": 12000,
            "calories_data": {"total_burned_calories": 2800},
            "distance_data": {"distance_meters": 10500},
            "date": "2025-02-10"
        },
        {
            "steps": 8800,
            "calories_data": {"total_burned_calories": 2200},
            "distance_data": {"distance_meters": 7800},
            "date": "2025-02-09"
        },
        {
            "steps": 9500,
            "calories_data": {"total_burned_calories": 2400},
            "distance_data": {"distance_meters": 8500},
            "date": "2025-02-08"
        },
        {
            "steps": 7200,
            "calories_data": {"total_burned_calories": 1850},
            "distance_data": {"distance_meters": 6500},
            "date": "2025-02-07"
        },
        {
            "steps": 11000,
            "calories_data": {"total_burned_calories": 2600},
            "distance_data": {"distance_meters": 9500},
            "date": "2025-02-06"
        },
        {
            "steps": 8300,
            "calories_data": {"total_burned_calories": 2050},
            "distance_data": {"distance_meters": 7300},
            "date": "2025-02-05"
        },
        {
            "steps": 9800,
            "calories_data": {"total_burned_calories": 2450},
            "distance_data": {"distance_meters": 8800},
            "date": "2025-02-04"
        },
        {
            "steps": 7500,
            "calories_data": {"total_burned_calories": 1950},
            "distance_data": {"distance_meters": 6800},
            "date": "2025-02-03"
        },
        {
            "steps": 10800,
            "calories_data": {"total_burned_calories": 2550},
            "distance_data": {"distance_meters": 9200},
            "date": "2025-02-02"
        }
    ]
}

@app.route('/analyze_garmin_data', methods=['GET'])
def analyze_garmin_data():
    try:
        # Calculate averages from all data points
        total_days = len(SAMPLE_GARMIN_DATA['data'])
        avg_steps = sum(day['steps'] for day in SAMPLE_GARMIN_DATA['data']) / total_days
        avg_calories = sum(day['calories_data']['total_burned_calories'] for day in SAMPLE_GARMIN_DATA['data']) / total_days
        avg_distance = sum(day['distance_data']['distance_meters'] for day in SAMPLE_GARMIN_DATA['data']) / total_days / 1000  # Convert to km
        
        # Calculate min and max values for context
        min_steps = min(day['steps'] for day in SAMPLE_GARMIN_DATA['data'])
        max_steps = max(day['steps'] for day in SAMPLE_GARMIN_DATA['data'])
        min_calories = min(day['calories_data']['total_burned_calories'] for day in SAMPLE_GARMIN_DATA['data'])
        max_calories = max(day['calories_data']['total_burned_calories'] for day in SAMPLE_GARMIN_DATA['data'])
        min_distance = min(day['distance_data']['distance_meters'] for day in SAMPLE_GARMIN_DATA['data']) / 1000
        max_distance = max(day['distance_data']['distance_meters'] for day in SAMPLE_GARMIN_DATA['data']) / 1000
        
        activity_level = "Low" if avg_steps < 5000 else "Moderate" if avg_steps < 10000 else "High"
        
        # Calculate suggested goals based on averages
        suggested_distance = round(avg_distance * 1.2, 1)  # 20% increase from average
        suggested_time = 45 if activity_level == "Low" else 60 if activity_level == "Moderate" else 75
        suggested_calories = round(avg_calories * 1.15)  # 15% increase from average
        
        # Prepare analysis prompt with averages and ranges
        analysis_prompt = f"""
        Based on the following 2-week average Garmin fitness data:
        Average Daily Steps: {avg_steps:.0f} (Range: {min_steps} - {max_steps})
        Average Daily Calories Burned: {avg_calories:.0f} (Range: {min_calories} - {max_calories})
        Average Daily Distance: {avg_distance:.1f} km (Range: {min_distance:.1f} - {max_distance:.1f} km)
        Overall Activity Level: {activity_level}
        
        I've calculated the following suggested daily goals based on these 2-week averages:
        - Daily Distance: {suggested_distance} km
        - Daily Active Time: {suggested_time} minutes
        - Daily Calories: {suggested_calories} calories

        Please provide:
        1. A concise analysis of their fitness level based on these 2-week averages
        2. Brief explanations for each suggested daily goal, specifically why these targets are appropriate based on their average performance
        3. Format the response as:
           - First paragraph: Overall analysis of 2-week performance
           - Three separate explanations, one for each goal, starting with "Distance Goal:", "Time Goal:", and "Calories Goal:"
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
        
        # Extract goal explanations using regex
        distance_explanation = re.search(r'Distance Goal:(.*?)(?=Time Goal:|$)', analysis, re.DOTALL)
        time_explanation = re.search(r'Time Goal:(.*?)(?=Calories Goal:|$)', analysis, re.DOTALL)
        calories_explanation = re.search(r'Calories Goal:(.*?)(?=$)', analysis, re.DOTALL)
        
        # Create suggested goals with explanations
        suggested_goals = {
            "distance": {
                "value": suggested_distance,
                "unit": "km",
                "explanation": distance_explanation.group(1).strip() if distance_explanation else "Goal based on your 2-week average distance."
            },
            "time": {
                "value": suggested_time,
                "unit": "min",
                "explanation": time_explanation.group(1).strip() if time_explanation else "Goal based on your activity level over 2 weeks."
            },
            "calories": {
                "value": suggested_calories,
                "unit": "cal",
                "explanation": calories_explanation.group(1).strip() if calories_explanation else "Goal based on your 2-week average calorie burn."
            }
        }
        
        # Extract the overall analysis (everything before "Distance Goal:")
        overall_analysis = analysis.split("Distance Goal:")[0].strip()
        
        return jsonify({
            "status": "success",
            "analysis": overall_analysis,
            "insights": [
                f"Activity Level: {activity_level}",
                f"Average Daily Steps: {avg_steps:,.0f} (Range: {min_steps:,} - {max_steps:,})",
                f"Average Daily Calories: {avg_calories:,.0f} (Range: {min_calories:,} - {max_calories:,})",
                f"Average Daily Distance: {avg_distance:.1f} km (Range: {min_distance:.1f} - {max_distance:.1f} km)"
            ],
            "suggested_goals": suggested_goals
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

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

# Global variable to store streak count and file path
STREAK_FILE = 'streak.json'

def load_streak():
    try:
        with open(STREAK_FILE, 'r') as f:
            data = json.load(f)
            return {
                'streak': data.get('streak', 0),
                'last_check_in': data.get('last_check_in', None)
            }
    except FileNotFoundError:
        return {'streak': 0, 'last_check_in': None}

def save_streak(streak_data):
    with open(STREAK_FILE, 'w') as f:
        json.dump(streak_data, f)

# Initialize streak from file
streak_data = load_streak()
streak_count = streak_data['streak']
last_check_in = streak_data['last_check_in']
print(f"Initial streak count loaded: {streak_count}, Last check-in: {last_check_in}")

@app.route('/update_streak', methods=['POST', 'OPTIONS'])
def update_streak():
    global streak_count, last_check_in
    if request.method == "OPTIONS":
        response = jsonify({"message": "OPTIONS request received"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    try:
        current_date = datetime.datetime.now().strftime('%Y-%m-%d')
        
        # Only increment streak if it's a new day
        if last_check_in != current_date:
            print(f"[UPDATE] Current streak before increment: {streak_count}")
            streak_count += 1
            last_check_in = current_date
            save_streak({
                'streak': streak_count,
                'last_check_in': last_check_in
            })
            print(f"[UPDATE] New streak count saved: {streak_count}, Last check-in: {last_check_in}")
        
        return jsonify({
            "streak": {
                "current": streak_count,
                "lastCheckIn": last_check_in,
                "status": "success",
                "error": None
            }
        }), 200
    except Exception as e:
        print(f"[ERROR] Failed to update streak: {str(e)}")
        return jsonify({
            "streak": {
                "current": streak_count,
                "lastCheckIn": last_check_in,
                "status": "error",
                "error": str(e)
            }
        }), 500

@app.route('/get_streak', methods=['GET'])
def get_streak():
    global streak_count, last_check_in
    try:
        # Load latest data from file
        streak_data = load_streak()
        streak_count = streak_data['streak']
        last_check_in = streak_data['last_check_in']
        
        print(f"[GET] Current streak count: {streak_count}, Last check-in: {last_check_in}")
        return jsonify({
            "streak": {
                "current": streak_count,
                "lastCheckIn": last_check_in,
                "status": "success",
                "error": None
            }
        }), 200
    except Exception as e:
        print(f"[ERROR] Failed to get streak: {str(e)}")
        return jsonify({
            "streak": {
                "current": streak_count,
                "lastCheckIn": last_check_in,
                "status": "error",
                "error": str(e)
            }
        }), 500

@app.route('/reset_streak', methods=['POST', 'OPTIONS'])
def reset_streak():
    global streak_count, last_check_in
    if request.method == "OPTIONS":
        response = jsonify({"message": "OPTIONS request received"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    try:
        print(f"[RESET] Current streak before reset: {streak_count}")
        streak_count = 0
        last_check_in = None
        save_streak({
            'streak': streak_count,
            'last_check_in': last_check_in
        })
        print(f"[RESET] Streak reset to: {streak_count}")
        return jsonify({
            "streak": {
                "current": streak_count,
                "lastCheckIn": last_check_in,
                "status": "success",
                "error": None
            }
        }), 200
    except Exception as e:
        print(f"[ERROR] Failed to reset streak: {str(e)}")
        return jsonify({
            "streak": {
                "current": streak_count,
                "lastCheckIn": last_check_in,
                "status": "error",
                "error": str(e)
            }
        }), 500

@app.route('/update_metrics', methods=['POST', 'OPTIONS'])
def update_metrics():
    if request.method == "OPTIONS":
        response = jsonify({"message": "OPTIONS request received"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    try:
        data = request.get_json()
        metrics = data.get('metrics')
        
        if not metrics:
            return jsonify({
                "status": "error",
                "message": "Missing metrics data"
            }), 400

        # Load current goals
        with open('goals.json', 'r') as f:
            goals = json.load(f)

        # Update current values based on metrics
        if 'distance' in metrics:
            goals['distance']['current'] = float(metrics['distance'])
        if 'active_time' in metrics:
            goals['time']['current'] = int(metrics['active_time'])
        if 'calories' in metrics:
            goals['calories']['current'] = int(metrics['calories'])

        # Save updated goals
        with open('goals.json', 'w') as f:
            json.dump(goals, f)

        print(f"[UPDATE] Updated goals with metrics: {goals}")

        return jsonify({
            "status": "success",
            "goals": goals
        }), 200

    except Exception as e:
        print(f"Error updating metrics: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/get_goals', methods=['GET'])
def get_goals():
    try:
        with open('goals.json', 'r') as f:
            goals = json.load(f)
        return jsonify({
            "status": "success",
            "goals": goals
        }), 200
    except Exception as e:
        print(f"Error getting goals: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)
