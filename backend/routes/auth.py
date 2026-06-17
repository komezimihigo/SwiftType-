
from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from database import models
from flask_dance.contrib.google import (
    make_google_blueprint,
    google)
import os
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

google_bp = make_google_blueprint(
    client_id="280114387732-tbnvsfpkk3e5me2is1jpmk192nqmpm97.apps.googleusercontent.com",
    client_secret="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",
    scope=[
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
    ]
)

import os

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


# Register route
@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'GET':
        return render_template('register.html')

    # Handle POST request
    data = request.get_json() if request.is_json else request.form

    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    password_confirm = data.get('password_confirm', '')

    # Validation
    if not username or len(username) < 3:
        return jsonify({'success': False, 'error': 'Username must be at least 3 characters'}), 400

    if not email or '@' not in email:
        return jsonify({'success': False, 'error': 'Invalid email'}), 400

    if not password or len(password) < 6:
        return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400

    if password != password_confirm:
        return jsonify({'success': False, 'error': 'Passwords do not match'}), 400

    # Create user
    password_hash = generate_password_hash(password)
    result = models.create_user(username, email, password_hash)

    if result['success']:
        return jsonify({'success': True, 'message': 'Registration successful. Please login.'}), 201
    else:
        return jsonify({'success': False, 'error': result['error']}), 400


# Login route
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'GET':
        return render_template('login.html')

    # Handle POST request
    data = request.get_json() if request.is_json else request.form

    username = data.get('username', '').strip()
    password = data.get('password', '')

    # Get user
    user = models.get_user(username)

    if not user or not check_password_hash(user['password'], password):
        return jsonify({'success': False, 'error': 'Invalid username or password'}), 401

    if models.is_admin(user['id']):
        redirect_url = '/admin/dashboard'
    else:
        redirect_url = '/dashboard'

    session['user_id'] = user['id']
    session['username'] = user['username']

    return jsonify({
        'success': True,
        'message': 'login successfully',
        'redirect': redirect_url
    }), 200

# Logout route
@auth_bp.route('/logout', methods=['POST'])
def logout():
    """User logout"""
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200


# Check login status
@auth_bp.route('/status', methods=['GET'])
def status():
    """Check if user is logged in"""
    if 'user_id' in session:
        user = models.get_user_by_id(session['user_id'])
        return jsonify({
            'logged_in': True,
            'user_id': session['user_id'],
            'username': user['username']
        }), 200
    else:
        return jsonify({'logged_in': False}), 200

@auth_bp.route("/google-check")
def google_check():

    print("AUTHORIZED:", google.authorized)

    if google.authorized:
        return redirect("/auth/google-success")

    return redirect("/auth/login")

@auth_bp.route("/google-success", methods=['GET', 'POST'])
def google_success():
    print("google success route reached")

    if not google.authorized:
        return redirect("/login/google")

    response = google.get("/oauth2/v2/userinfo")

    if not response.ok:
        return "Google Login Failed"

    info = response.json()

    email = info.get("email")
    name = info.get("name")

    user = models.get_user_by_email(email)

    # Create account automatically
    if not user:

        result = models.create_user(
            username=name,
            email=email,
            password="google_login"
        )

        user = models.get_user_by_email(email)

    session["user_id"] = user["id"]
    print("user:", user)
    print("session:", session)
    return redirect(url_for("dashboard"))



@auth_bp.route("/test")
def test():
        return "auth worked"
