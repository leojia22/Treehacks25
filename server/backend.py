import logging

import flask
from flask import request
from terra.base_client import Terra

import datetime

logging.basicConfig(level=logging.INFO)

_LOGGER = logging.getLogger("app")

app = flask.Flask(__name__)

webhook_secret = "5803b7fc21a38e8ef188f6ed3d6e63e9d096fa72cf3eccd7"
dev_id = '4actk-fitstreak-testing-wfRE9vBU8U'
api_key = 'A-vwB8CGUoNrQvbP0SUM-dD4mABGFq7Z'

terra = Terra(api_key=api_key, dev_id=dev_id, secret=webhook_secret)

@app.route("/consumeTerraWebhook", methods=['POST'] )

def consume_terra_webhook():
    body = request.get_json()

    verified = terra.check_terra_signature(request.data.decode("utf-8"), request.headers['terra-signature'])

    if not verified:
        _LOGGER.info('NO')
        return flask.Response(status=403)

    _LOGGER.info("Received Terra Webhook: %s", body)

    return flask.Response(status=200)

@app.route('/authenticate', methods=['GET'])
def authenticate():
    widget_response = terra.generate_widget_session(providers=['GARMIN'], reference_='1234')
    widget_url = widget_response.get_json()['url']
    return flask.Response(f"<button onclick=\"location.href='{widget_url}'\">Authenticate with GARMIN</button>", mimetype='text/html')
    
# 164bd16d-b5f9-4dd4-83e8-bada13a43104
@app.route('/backfill', methods=['GET'])
def backfill():
    user_id = '0b636ce7-bf91-4e5a-bfcb-44d25e460054'

    terra_user = terra.from_user_id(user_id)

    sleep_data = terra_user.get_sleep(
        start_date=datetime.datetime(2025, 2, 15),
        end_date=datetime.datetime(2025, 2, 17),
        to_webhook=False, with_samples=True
    )

    return sleep_data.get_json()

if __name__ == "__main__":
    app.run()
