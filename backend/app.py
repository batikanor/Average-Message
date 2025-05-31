from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes and origins

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify(message="thisisHello, World!"), 200

if __name__ == "__main__":
    port = int(os.environ.get("BACKEND_INTERNAL_PORT") or os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
