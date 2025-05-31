from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes and origins

# Configure database from environment variable
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Memory model
class Memory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(280), nullable=False)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'lat': self.lat,
            'lng': self.lng,
            'created_at': self.created_at.isoformat()
        }

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify(message="thisisHello, World!"), 200

@app.route('/api/memories', methods=['POST'])
def add_memory():
    data = request.get_json()
    text = data.get('text')
    lat = data.get('lat')
    lng = data.get('lng')
    if not text or lat is None or lng is None:
        return jsonify({'error': 'Missing required fields'}), 400
    memory = Memory(text=text, lat=lat, lng=lng)
    db.session.add(memory)
    db.session.commit()
    return jsonify(memory.to_dict()), 201

@app.route('/api/memories', methods=['GET'])
def get_memories():
    memories = Memory.query.order_by(Memory.created_at.desc()).all()
    return jsonify([m.to_dict() for m in memories]), 200

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    port = int(os.environ.get("BACKEND_INTERNAL_PORT") or os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
