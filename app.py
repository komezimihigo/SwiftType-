from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime, timedelta
from functools import wraps
from database.models import create_tables
from flask_dance.contrib.google import google
from werkzeug.middleware.proxy_fix import ProxyFix


# Initialize Flask app
app = Flask(__name__)
app.wsgi_app = ProxyFix(
    app.wsgi_app,
    x_for=1,
    x_proto=1,
    x_host=1,
    x_port=1
)
app.secret_key = '1234567890'
app.config['DATABASE'] = 'typing_app.db'

# Import routes and services
from backend.routes import auth, typing_routes, stats, chat, trainer
from backend.services import scoring, ai_trainer
from backend.routes.listen import listen_bp
from backend.routes.admin import admin_bp
# Register blueprints
app.register_blueprint(auth.auth_bp)
app.register_blueprint(typing_routes.typing_bp)
app.register_blueprint(stats.stats_bp)
app.register_blueprint(admin_bp)  # NEW
app.register_blueprint(chat.chat_bp)  # NEW
app.register_blueprint(trainer.trainer_bp)
app.register_blueprint(listen_bp)
app.register_blueprint(auth.google_bp,
    url_prefix="/login"
)

# Database initialization
def init_db():
    """Initialize database with required tables"""
    if not os.path.exists(app.config['DATABASE']):
        from database import models
        models.create_tables()


# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)

    return decorated_function


# Track visitors (UPDATED)
@app.before_request
def track_visitor():
    """Track visitor IP and location"""
    from database import models

    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent', '')
    user_id = session.get('user_id')

    # Get geolocation data (simple implementation)
    country = 'Unknown'
    city = 'Unknown'

    try:
        # Try to get geolocation from IP (optional - requires API)
        # You can use free APIs like:
        # - https://ipapi.co/json/
        # - https://geoip-api.com/api/geoip/

        import requests
        try:
            geo_response = requests.get(f'https://ipapi.co/{ip_address}/json/', timeout=2)
            if geo_response.status_code == 200:
                geo_data = geo_response.json()
                country = geo_data.get('country_name', 'Unknown')
                city = geo_data.get('city', 'Unknown')
        except:
            pass  # Geolocation failed, use defaults
    except:
        pass

    # Log visitor
    models.log_visitor(ip_address, country, city, user_agent, user_id)


# Home page
@app.route('/')
def index():
    print("HOME ROUTE REACHED")
    print("GOOGLE AUTHORIZED =", google.authorized)

    if google.authorized:
        print("REDIRECTING TO GOOGLE SUCCESS")
        return redirect("/auth/google-success")
    return render_template('index.html')


# Dashboard
@app.route('/dashboard')
@login_required
def dashboard():
    """User dashboard with stats"""
    return render_template('dashboard.html')


# Typing test page
@app.route('/test')
@login_required
def test():
    """Typing test page"""
    return render_template('test.html')


# Get practice text
@app.route('/api/practice-text', methods=['GET'])
def get_practice_text():
    """Get text for typing practice"""
    mode = request.args.get('mode', 'normal')
    user_id = session.get('user_id')

    if mode == 'weak_keys' and user_id:
        # AI trainer: generate text based on weak keys
        text = ai_trainer.generate_weak_key_text(user_id)
    else:
        # Normal random text
        text = ai_trainer.generate_normal_text()

    return jsonify({'text': text})

@app.route('/trainer')
@login_required
def trainer():
    """Serve the main HTML file"""
    return render_template('trainer.html')



# Save typing result
@app.route('/api/save-result', methods=['POST'])
@login_required
def save_result():
    """Save typing test result"""
    data = request.get_json()
    user_id = session.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'error': 'Not logged in'}), 401

    # Calculate WPM and accuracy
    result = scoring.calculate_score(
        typed_text=data.get('typed_text'),
        original_text=data.get('original_text'),
        time_seconds=data.get('time_seconds')
    )

    # Save to database
    from database import models
    models.save_result(
        user_id=user_id,
        wpm=result['wpm'],
        accuracy=result['accuracy'],
        errors=result['errors'],
        raw_wpm=result['raw_wpm']
    )

    # Analyze mistakes for AI trainer
    ai_trainer.analyze_mistakes(user_id, data.get('typed_text'), data.get('original_text'))

    return jsonify({'success': True, 'result': result})


# Get user stats
@app.route('/api/user-stats', methods=['GET'])
@login_required
def get_user_stats():
    """Get user statistics"""
    user_id = session.get('user_id')
    from database import models

    stats_data = models.get_user_stats(user_id)
    weak_keys = models.get_weak_keys(user_id)

    return jsonify({
        'stats': stats_data,
        'weak_keys': weak_keys
    })


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404


@app.errorhandler(403)
def forbidden(error):
    return render_template('403.html'), 403


@app.errorhandler(500)
def server_error(error):
    return render_template('500.html'), 500


if __name__ == '__main__':
    init_db()
    create_tables()
    app.run(host="0.0.0.0", port=5000, debug=True)
