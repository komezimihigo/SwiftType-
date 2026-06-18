"""
AI Chatbot Routes
Uses Google Gemini API for responses
"""

from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
import requests
import os
from database import models

chat_bp = Blueprint('chat', __name__, url_prefix='/chat')

import os

print("GEMINI KEY:", os.getenv("GEMINI_API_KEY"))
# Configuration
GEMINI_API_KEY = "AQ.Ab8RN6JA4I528DsS8KE95XPXdRFHMBpCw0qYN3N4kkUsaBGhoA",

GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'


# Login required decorator
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
    """Chat page"""
    return render_template('chat.html')


# ==================== CHAT API ====================

@chat_bp.route('/api/send-message', methods=['POST'])
@login_required
def send_message():
    """
    Send a message to the AI chatbot

    Expected JSON:
    {
        "message": "user message text"
    }
    """
    user_id = session.get('user_id')
    data = request.get_json()
    user_message = data.get('message', '').strip()

    # Validation
    if not user_message:
        return jsonify({
            'success': False,
            'error': 'Message cannot be empty'
        }), 400

    if len(user_message) > 1000:
        return jsonify({
            'success': False,
            'error': 'Message is too long (max 1000 characters)'
        }), 400

    if not GEMINI_API_KEY:
        return jsonify({
            'success': False,
            'error': 'Chat service is not configured. Please set GEMINI_API_KEY environment variable.'
        }), 500

    try:
        # Call Gemini API
        ai_response = call_gemini_api(user_message)

        if ai_response is None:
            return jsonify({
                'success': False,
                'error': 'Failed to get response from AI service'
            }), 500

        # Save to database
        models.save_chat_message(user_id, user_message, ai_response)

        return jsonify({
            'success': True,
            'response': ai_response
        }), 200

    except Exception as e:
        print(f"Chat error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error: {str(e)}'
        }), 500


@chat_bp.route('/api/history', methods=['GET'])
@login_required
def get_history():
    """Get chat history for current user"""
    user_id = session.get('user_id')
    limit = request.args.get('limit', 20, type=int)

    history = models.get_chat_history(user_id, limit)

    return jsonify({
        'success': True,
        'history': history
    }), 200


# ==================== HELPER FUNCTIONS ====================

def call_gemini_api(message):
    """
    Call Google Gemini API and get response

    Args:
        message (str): User message

    Returns:
        str: AI response or None if error
    """
    try:
        # Prepare request payload
        payload = {
            'contents': [
                {
                    'parts': [
                        {
                            'text': message
                        }
                    ]
                }
            ]
        }

        # Add API key to URL
        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"

        # Make request
        response = requests.post(
            url,
            json=payload,
            timeout=30,
            headers={'Content-Type': 'application/json'}
        )

        # Check response status
        if response.status_code != 200:
            print(f"Gemini API error: {response.status_code} - {response.text}")
            return None

        # Extract response text
        data = response.json()

        # Navigate nested structure
        try:
            ai_text = data['candidates'][0]['content']['parts'][0]['text']
            return ai_text.strip()
        except (KeyError, IndexError, TypeError) as e:
            print(f"Error parsing Gemini response: {str(e)}")
            return None

    except requests.exceptions.Timeout:
        print("Gemini API request timed out")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Gemini API request error: {str(e)}")
        return None
    except Exception as e:
        print(f"Unexpected error calling Gemini API: {str(e)}")
        return None
