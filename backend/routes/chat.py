"""
AI Chatbot Routes
Uses Google Gemini API for responses
"""

from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
import requests
import os
from database import models

# ==================== BLUEPRINT ====================
chat_bp = Blueprint('chat', __name__, url_prefix='/chat')

# ==================== CONFIG ====================
GEMINI_API_KEY = os.getenv("AQ.Ab8RN6Ih3sYbsvdM0L5jvavl43wAt_ajYlDKWoNn8iFu4vjoVA")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"


# ==================== LOGIN REQUIRED ====================
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


# ==================== CHAT PAGE ====================
@chat_bp.route('/')
@login_required
def chat_page():
    return render_template('chat.html')


# ==================== SEND MESSAGE ====================
@chat_bp.route('/api/send-message', methods=['POST'])
@login_required
def send_message():
    user_id = session.get('user_id')
    data = request.get_json()

    # Validate request body
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON request'}), 400

    user_message = data.get('message', '').strip()

    # Validate message
    if not user_message:
        return jsonify({'success': False, 'error': 'Message cannot be empty'}), 400

    if len(user_message) > 1000:
        return jsonify({'success': False, 'error': 'Message too long (max 1000 characters)'}), 400

    if not GEMINI_API_KEY:
        return jsonify({
            'success': False,
            'error': 'Gemini API key not configured'
        }), 500

    try:
        ai_response = call_gemini_api(user_message)

        if not ai_response:
            return jsonify({
                'success': False,
                'error': 'AI service failed to respond'
            }), 500

        # Save chat
        models.save_chat_message(user_id, user_message, ai_response)

        return jsonify({
            'success': True,
            'response': ai_response
        }), 200

    except Exception as e:
        print("Chat error:", str(e))
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500


# ==================== CHAT HISTORY ====================
@chat_bp.route('/api/history', methods=['GET'])
@login_required
def get_history():
    user_id = session.get('user_id')
    limit = request.args.get('limit', 20, type=int)

    history = models.get_chat_history(user_id, limit)

    return jsonify({
        'success': True,
        'history': history
    }), 200


# ==================== GEMINI CALL ====================
def call_gemini_api(message):
    try:
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": message
                        }
                    ]
                }
            ]
        }

        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"

        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        if response.status_code != 200:
            print("Gemini API error:", response.text)
            return None

        data = response.json()

        # Safe extraction
        try:
            return (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
                .strip()
            )
        except Exception:
            print("Error parsing Gemini response")
            return None

    except requests.exceptions.Timeout:
        print("Gemini API timeout")
        return None

    except requests.exceptions.RequestException as e:
        print("Request error:", str(e))
        return None

    except Exception as e:
        print("Unexpected error:", str(e))
        return None
