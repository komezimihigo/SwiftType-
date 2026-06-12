from flask import Blueprint, jsonify, session
from functools import wraps
from database import models

stats_bp = Blueprint('stats', __name__, url_prefix='/stats')


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Not logged in'}), 401
        return f(*args, **kwargs)

    return decorated_function


@stats_bp.route('/results', methods=['GET'])
@login_required
def get_results():
    """Get user's typing test results"""
    user_id = session.get('user_id')
    results = models.get_user_results(user_id)

    return jsonify({
        'success': True,
        'results': results
    }), 200


@stats_bp.route('/summary', methods=['GET'])
@login_required
def get_summary():
    """Get user statistics summary"""
    user_id = session.get('user_id')
    stats = models.get_user_stats(user_id)
    weak_keys = models.get_weak_keys(user_id)

    return jsonify({
        'success': True,
        'stats': stats,
        'weak_keys': weak_keys
    }), 200
