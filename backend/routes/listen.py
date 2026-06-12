from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
import json
import random

# Create Blueprint for integration with main app
listen_bp = Blueprint('listen', __name__, url_prefix='/listen', static_folder='static', template_folder='templates')

# ==================== WORD & SENTENCE DATA ====================

EASY_WORDS = [
    'cat', 'dog', 'run', 'sit', 'eat', 'sun', 'moon', 'star', 'tree', 'fish',
    'bird', 'hand', 'foot', 'head', 'eyes', 'nose', 'ear', 'walk', 'jump', 'play',
    'book', 'pen', 'cup', 'hat', 'car', 'bus', 'train', 'ship', 'bike', 'ball'
]

MEDIUM_WORDS = [
    'elephant', 'butterfly', 'rainbow', 'mountain', 'river', 'forest', 'ocean', 'garden',
    'kitchen', 'bedroom', 'window', 'door', 'carpet', 'blanket', 'pillow', 'bottle',
    'computer', 'keyboard', 'telephone', 'television', 'weather', 'breakfast', 'lunch',
    'dinner', 'favorite', 'beautiful', 'wonderful', 'important', 'different', 'special'
]

EASY_SENTENCES = [
    'The cat sat on the mat.',
    'I like to eat apples.',
    'The sun is bright today.',
    'I have a blue pen.',
    'Dogs are very friendly.',
    'The bird can fly high.',
    'I love to read books.',
    'Water is very important.',
    'The tree is very tall.',
    'I play with my friends.'
]

MEDIUM_SENTENCES = [
    'The quick brown fox jumps over the lazy dog.',
    'I enjoy reading books in my free time.',
    'The weather today is sunny and pleasant.',
    'Learning to type is an important skill.',
    'Practice makes perfect in everything we do.',
    'The beautiful garden has many colorful flowers.',
    'Technology has changed our lives significantly.',
    'I want to improve my typing speed.',
    'Writing clearly is important for communication.',
    'Music is a universal language for everyone.'
]

HARD_SENTENCES = [
    'The fundamental purpose of education is to develop critical thinking and problem-solving skills.',
    'Artificial intelligence is revolutionizing industries and changing the way we work.',
    'Effective communication requires clear thinking and understanding the perspective of others.',
    'The convergence of technology and human creativity creates unprecedented opportunities for innovation.',
    'Sustainable development is essential for maintaining a healthy environment for future generations.',
    'Typing proficiency is a valuable skill that enhances productivity in the digital age.',
    'Professional success depends not only on technical skills but also on interpersonal abilities.',
    'The digital revolution has transformed traditional business models and created new economies.',
    'Continuous learning and adaptation are crucial in our rapidly changing world.',
    'Mastering typing requires dedication, practice, and a systematic approach to improvement.'
]

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)

    return decorated_function

# ==================== ROUTES ====================

@listen_bp.route('/')
@login_required
def index():
    """
Serve
the
listen and write
interface
"""
    return render_template('listen.html')

@listen_bp.route('/api/words', methods=['GET'])
@login_required
def get_words():
    """
Get
words
based
on
difficulty
level
"""
    difficulty = request.args.get('difficulty', 'easy')
    count = request.args.get('count', 1, type=int)

    word_list = {
        'easy': EASY_WORDS,
        'medium': MEDIUM_WORDS,
        'hard': MEDIUM_WORDS  # Use medium for hard words
    }

    selected_words = random.sample(word_list.get(difficulty, EASY_WORDS),
                                   min(count, len(word_list.get(difficulty, EASY_WORDS))))

    return jsonify({
        'success': True,
        'words': selected_words,
        'difficulty': difficulty
    })

@listen_bp.route('/api/sentences', methods=['GET'])
@login_required
def get_sentences():
    """
Get
sentences
based
on
difficulty
level
"""
    difficulty = request.args.get('difficulty', 'easy')
    count = request.args.get('count', 1, type=int)

    sentence_list = {
        'easy': EASY_SENTENCES,
        'medium': MEDIUM_SENTENCES,
        'hard': HARD_SENTENCES
    }

    selected_sentences = random.sample(sentence_list.get(difficulty, EASY_SENTENCES),
                                       min(count, len(sentence_list.get(difficulty, EASY_SENTENCES))))

    return jsonify({
        'success': True,
        'sentences': selected_sentences,
        'difficulty': difficulty
    })


@listen_bp.route('/api/batch', methods=['GET'])
@login_required
def get_batch():

    item_type = request.args.get('type', 'words')
    difficulty = request.args.get('difficulty', 'easy')
    batch_size = request.args.get('batch_size', 5, type=int)

    if item_type == 'words':

        word_list = {
            'easy': EASY_WORDS,
            'medium': MEDIUM_WORDS,
            'hard': MEDIUM_WORDS
        }

        items = random.sample(
            word_list.get(difficulty, EASY_WORDS),
            min(batch_size, len(word_list.get(difficulty, EASY_WORDS)))
        )

    else:

        sentence_list = {
            'easy': EASY_SENTENCES,
            'medium': MEDIUM_SENTENCES,
            'hard': HARD_SENTENCES
        }

        items = random.sample(
            sentence_list.get(difficulty, EASY_SENTENCES),
            min(batch_size, len(sentence_list.get(difficulty, EASY_SENTENCES)))
        )

    return jsonify({
        'success': True,
        'items': items
    })

