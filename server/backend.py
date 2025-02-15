import logging

import flask
from flask import request
from terra.base_client import Terra


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
    


if __name__ == "__main__":
    app.run()
