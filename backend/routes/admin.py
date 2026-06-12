print("admin.py loaded")

from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
from database import models

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

ADMIN_SECRET_KEY = "1234"


# ==================== DECORATOR ====================

def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user_id = session.get('user_id')

        if not user_id:
            return redirect(url_for('auth.login'))

        if not models.is_admin(user_id):
            return render_template('403.html'), 403

        return f(*args, **kwargs)

    return wrapper


# ==================== DASHBOARD ====================

@admin_bp.route('/dashboard')
@admin_required
def dashboard():
    return render_template('admin.html')


# ==================== APIs ====================

@admin_bp.route('/api/users')
@admin_required
def users():
    data = models.get_all_users()
    return jsonify(success=True, users=data, total=len(data))


@admin_bp.route('/api/results')
@admin_required
def results():
    data = models.get_all_results()
    return jsonify(success=True, results=data)


@admin_bp.route('/api/stats')
@admin_required
def stats():
    return jsonify(success=True, stats=models.get_all_stats())


@admin_bp.route('/api/visitors')
@admin_required
def visitors():
    data = models.get_recent_visitors()
    return jsonify(success=True, visitors=data)


@admin_bp.route('/api/set-admin', methods=['POST'])
@admin_required
def set_admin():
    data = request.get_json()

    user_id = data.get('user_id')
    is_admin = data.get('is_admin')

    if user_id == session['user_id'] and not is_admin:
        return jsonify(success=False, error="Cannot remove yourself"), 400

    models.set_admin(user_id, is_admin)
    return jsonify(success=True)


# ==================== ADMIN CREATE ====================
@admin_bp.route('/register-admin', methods=['GET', 'POST'])
def register_admin():

    if request.method == 'GET':
        return redirect(url_for('admin.register_admin_page'))

    # POST (form submission)
    admin_key = request.form.get('admin_key')
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')

    if admin_key != ADMIN_SECRET_KEY:
        return "Invalid admin key", 403

    if not username or not email or not password:
        return "Missing fields", 400

    user_id = models.create_user(username, email, password, is_admin=True)

    if not user_id:
        return "User already exists", 400

    return redirect(url_for('auth.login'))


