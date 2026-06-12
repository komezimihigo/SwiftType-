"""
Advanced Typing Training System
Flask backend serving the typing trainer application
"""

from flask import Blueprint, Flask, render_template, jsonify, request, session, redirect, url_for
from functools import wraps
import random
import json

trainer_bp = Blueprint('trainer', __name__, url_prefix='/trainer')
# ==================== WORD LISTS ====================

# Common English words for typing practice
COMMON_WORDS = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
    'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    'fast', 'slow', 'type', 'speed', 'train', 'skill', 'practice', 'improve', 'learn',
    'finger', 'keyboard', 'home', 'position', 'accurate', 'quick', 'master', 'expert',
    'typing', 'test', 'challenge', 'level', 'score', 'accuracy', 'error', 'mistake',
    'session', 'record', 'progress', 'advance', 'difficulty', 'mode', 'pause', 'resume'
]

# Words organized by difficult letters/patterns
WEAK_KEY_WORDS = {
    's': ['sun', 'sand', 'safe', 'slow', 'swim', 'skill', 'small', 'system', 'see', 'some', 'sure', 'sound'],
    'q': ['quick', 'quit', 'question', 'quite', 'queen', 'quiet', 'quality'],
    'z': ['zone', 'zero', 'zoom', 'zeal', 'zip', 'zest'],
    'j': ['just', 'jump', 'join', 'job', 'judge', 'journey'],
    'x': ['next', 'box', 'fix', 'mix', 'text', 'exact'],
    'w': ['work', 'way', 'want', 'will', 'with', 'when', 'would', 'window'],
    'p': ['practice', 'people', 'place', 'please', 'play', 'phone'],
    'd': ['day', 'did', 'do', 'down', 'during', 'develop', 'drive'],
    'f': ['fast', 'find', 'first', 'from', 'for', 'feel', 'focus'],
    'k': ['know', 'keep', 'kind', 'key', 'kill', 'king'],
}

# ==================== FINGER MAPPING ====================

FINGER_MAPPING = {
    # Left hand
    'q': 'left_pinky', 'a': 'left_pinky', 'z': 'left_pinky',
    'w': 'left_ring', 's': 'left_ring', 'x': 'left_ring',
    'e': 'left_middle', 'd': 'left_middle', 'c': 'left_middle',
    'r': 'left_index', 'f': 'left_index', 'v': 'left_index',
    't': 'left_index', 'g': 'left_index', 'b': 'left_index',
    '1': 'left_pinky', '2': 'left_ring', '3': 'left_middle', '4': 'left_index', '5': 'left_index',

    # Right hand
    'y': 'right_index', 'h': 'right_index', 'n': 'right_index',
    'u': 'right_index', 'j': 'right_index', 'm': 'right_index',
    'i': 'right_middle', 'k': 'right_middle', ',': 'right_middle',
    'o': 'right_ring', 'l': 'right_ring', '.': 'right_ring',
    'p': 'right_pinky', ';': 'right_pinky', '/': 'right_pinky',
    '6': 'right_index', '7': 'right_index', '8': 'right_middle', '9': 'right_ring', '0': 'right_pinky',

    # Thumbs
    ' ': 'thumbs',
}
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)

    return decorated_function

# ==================== TEXT GENERATION ====================

def generate_practice_text(length=150, weak_keys=None):

    """
    Generate practice text
    If weak_keys provided, emphasize those letters
    """
    words = []
    current_length = 0

    if weak_keys and len(weak_keys) > 0:
        # AI mode: focus on weak keys
        for weak_key in weak_keys[:3]:  # Use top 3 weak keys
            if weak_key in WEAK_KEY_WORDS:
                words.extend(random.sample(WEAK_KEY_WORDS[weak_key], min(2, len(WEAK_KEY_WORDS[weak_key]))))

    # Fill rest with common words
    while current_length < length:
        word = random.choice(COMMON_WORDS)
        words.append(word)
        current_length += len(word) + 1

    return ' '.join(words[:30])  # Limit to ~30 words


# ==================== ROUTES ====================

@trainer_bp.route('/trainer')
@login_required
def trainer():
    """Serve the main HTML file"""
    return render_template('trainer.html')


@trainer_bp.route('/api/text', methods=['GET'])
@login_required
def get_text():
    """
    Generate practice text
    Query params:
    - mode: 'normal' or 'ai'
    - weak_keys: JSON array of weak letters
    """
    mode = request.args.get('mode', 'normal')
    weak_keys_param = request.args.get('weak_keys', '[]')

    try:
        weak_keys = json.loads(weak_keys_param)
    except:
        weak_keys = []

    text = generate_practice_text(weak_keys=weak_keys if mode == 'ai' else None)

    return jsonify({
        'text': text,
        'length': len(text)
    })


@trainer_bp.route('/api/finger-mapping', methods=['GET'])
@login_required
def get_finger_mapping():
    """Get finger to key mapping"""
    return jsonify(FINGER_MAPPING)


