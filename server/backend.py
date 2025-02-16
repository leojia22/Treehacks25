import logging

import flask
from terra.base_client import Terra

from flask import Flask, request, jsonify
from flask_cors import CORS
import os

import datetime
import requests

logging.basicConfig(level=logging.INFO)

_LOGGER = logging.getLogger("app")
app = flask.Flask(__name__)

# Remove the duplicate Flask app initialization
# Copyapp = flask.Flask(__name__)  <- Remove this line

# Use only Flask-CORS for handling CORS
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "x-api-key", "dev-id", "terra-signature"],
        "expose_headers": "*"
    }
})

# Remove the after_request decorator as CORS(app) handles everything
# @app.after_request
# def after_request(response):
#     ... remove this entire function

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
if __name__ == '__main__':
    app.run(debug=True, port=5002)
