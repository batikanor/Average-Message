from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import select
from datetime import datetime
import math
import random
import openai
import numpy as np
import re
from dotenv import load_dotenv

load_dotenv()

DISTANCE_ALLOWED_THRESHOLD = float(
    os.getenv("DISTANCE_ALLOWED_THRESHOLD", 60)  # default 50 m
)

# ---------- helpers ----------

EARTH_RADIUS_M = 6_371_000  # mean earth radius in metres

def haversine(lat1, lon1, lat2, lon2):
    """Great-circle distance between two (lat, lon) pairs in metres."""
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)

    a = math.sin(d_lat / 2) ** 2 + \
        math.cos(lat1) * math.cos(lat2) * math.sin(d_lon / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def random_offset(lat, max_metre):
    """Return a small (d_lat, d_lon) offset that is ≤ max_metre metres long."""
    # convert wanted radius [m] to degrees at this latitude
    radius_deg_lat = max_metre / 111_132          # 1° lat ≈ 111 132 m
    radius_deg_lon = max_metre / (111_132 * math.cos(math.radians(lat)))

    r = random.random() * 1.1 * radius_deg_lat    # 0 – 110 % of radius
    theta = random.random() * 2 * math.pi
    return r * math.cos(theta), r * math.sin(theta)  # (d_lat, d_lon)


def place_with_gap(lat, lon):
    """
    Jitter (lat, lon) until it is at least DISTANCE_ALLOWED_THRESHOLD metres
    from every existing Memory.  Returns a (lat, lon) pair.
    """
    # Fetch only what we need: existing coords
    existing = db.session.execute(
        select(Memory.lat, Memory.lng)
    ).all()

    max_attempts = 25
    for _ in range(max_attempts):
        too_close = False
        for lat2, lon2 in existing:
            if haversine(lat, lon, lat2, lon2) < DISTANCE_ALLOWED_THRESHOLD:
                too_close = True
                break
        if not too_close:
            return lat, lon  # safe spot!

        # Otherwise nudge and try again
        d_lat, d_lon = random_offset(lat, DISTANCE_ALLOWED_THRESHOLD)
        lat += d_lat
        lon += d_lon

    # Fallback: give up after max_attempts and return best-effort coords
    return lat, lon
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
    # lat = data.get('lat')
    # lng = data.get('lng')
    lat, lng = place_with_gap(data["lat"], data["lng"])

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

@app.route('/api/reset', methods=['POST'])
def reset_memories():
    try:
        num_deleted = db.session.query(Memory).delete()
        db.session.commit()
        return jsonify({'status': 'ok', 'deleted': num_deleted}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/summarize_cluster', methods=['POST'])
def summarize_cluster():
    print("Route Called")
    try:
        data = request.get_json()
        texts = data.get('texts', [])
        if not texts or not isinstance(texts, list):
            return jsonify({'error': 'Missing or invalid texts'}), 400

        openai.api_key = os.getenv('OPENAI_API_KEY')
        if not openai.api_key:
            return jsonify({'error': 'OpenAI API key not set'}), 500

        # Get embeddings for each text
        embeddings = []
        for text in texts:
            resp = openai.embeddings.create(
                input=text,
                model="text-embedding-ada-002"
            )
            embeddings.append(resp.data[0].embedding)

        avg_embedding = np.mean(np.array(embeddings), axis=0)

        # LLM: Generate 10 candidate summaries
        prompt = (
            "Given the following messages, generate 10 different single-sentence messages that best represent their average meaning, style, and content. "
            "Do not simply concatenate or list them. Instead, synthesize new messages that best represent the group as a whole. "
            "Return each message on a new line.\n"
            "Messages: " + "\n".join(f"- {t}" for t in texts)
        )
        chat_resp = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes and averages user messages into a single representative message."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.9,
            n=1
        )
        candidates_raw = chat_resp.choices[0].message.content.strip()
        # Split into lines, remove empty lines and leading numbers/bullets
        candidates = [re.sub(r"^[-\d.\s]*", "", line).strip() for line in candidates_raw.split("\n") if line.strip()]
        candidates = [c for c in candidates if c]  # Remove empty
        candidates = candidates[:10]  # Only use up to 10
        if not candidates:
            return jsonify({'error': 'No candidates generated'}), 500

        # Get embeddings for each candidate
        candidate_embeddings = []
        for cand in candidates:
            resp = openai.embeddings.create(
                input=cand,
                model="text-embedding-ada-002"
            )
            candidate_embeddings.append(resp.data[0].embedding)
        candidate_embeddings = np.array(candidate_embeddings)

        # Compute cosine similarity to avg_embedding
        def cosine_similarity(a, b):
            a = np.array(a)
            b = np.array(b)
            return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
        sims = [cosine_similarity(e, avg_embedding) for e in candidate_embeddings]
        best_idx = int(np.argmax(sims))
        best_summary = candidates[best_idx]
        return jsonify({"summary": best_summary, "count": len(texts)})
    except Exception as e:
        import traceback
        print("Error in /api/summarize_cluster:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    port = int(os.environ.get("BACKEND_INTERNAL_PORT") or os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
