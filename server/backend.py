import logging

import flask
from flask import request

logging.basicConfig(level=logging.INFO)

_LOGGER = logging.getLogger("app")

app = flask.Flask(__name__)

@app.route("/consumeTerraWebhook", methods=['POST'] )

def consume_terra_webhook():
    body = request.get_json()

    _LOGGER.info("Received Terra Webhook: %s", body)

    return flask.Response(status=200)

if __name__ == "__main__":
    app.run()
