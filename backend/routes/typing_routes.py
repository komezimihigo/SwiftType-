from flask import Blueprint, render_template, request, jsonify, session

typing_bp = Blueprint('typing', __name__, url_prefix='/typing')

@typing_bp.route('/')
def typing_test():
    """Typing test page"""
    return render_template('test.html')
