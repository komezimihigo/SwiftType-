"""
AI Trainer - Generates practice text based on user's weak keys
Rule-based system that creates custom typing exercises
"""

import random
from database import models

# Sample word lists
COMMON_WORDS = [
    'The quick brown fox jumps over the lazy dog.',
    'Practice typing every day to improve your speed and accuracy.',
    'Hard work and consistency always lead to great results.',
    'Never give up when things become difficult or challenging.',
    'Learning new skills takes time, patience, and daily effort.',
    'Focus on accuracy first before trying to increase your speed.',
    'A calm mind helps you type faster and with fewer mistakes.',
    'Small progress each day leads to big success over time.',
    'Always keep your fingers on the correct keyboard positions.',
    'The Lord is my shepherd; I shall not want.',
    'Good habits are the foundation of long-term success.',
    'Technology is changing the world faster than ever before.',
    'Reading and writing regularly will improve your typing skills.',
    'Mistakes are part of the learning process, so keep going.',
    'Stay motivated and keep pushing yourself to do better.',
    'Discipline is doing what needs to be done every single day.',
    'Jesus is the king of kings, my rock, my saviour.'
]

# Extended word lists for weak key training
SPECIAL_WORDS ={
'a': ['apple', 'ask', 'always', 'after', 'again', 'around', 'answer'],
'b': ['book', 'best', 'bring', 'before', 'build', 'become', 'between'],
'c': ['come', 'call', 'change', 'create', 'close', 'carry', 'choose'],
'd': ['day', 'down', 'drive', 'develop', 'decide', 'dream', 'deliver'],
'e': ['each', 'early', 'enter', 'enjoy', 'enough', 'example', 'energy'],
'f': ['find', 'fast', 'follow', 'focus', 'force', 'finish', 'future'],
'g': ['good', 'give', 'grow', 'great', 'guide', 'gain', 'ground'],
'h': ['have', 'help', 'hold', 'hope', 'hear', 'happen', 'human'],
'i': ['idea', 'into', 'improve', 'include', 'increase', 'impact', 'interest'],
'j': ['just', 'join', 'jump', 'judge', 'journey', 'job', 'joy'],
'k': ['keep', 'know', 'kind', 'key', 'kick', 'kill', 'knock'],
'l': ['like', 'learn', 'lead', 'live', 'look', 'leave', 'light'],
'm': ['make', 'move', 'meet', 'manage', 'measure', 'mind', 'moment'],
'n': ['need', 'name', 'number', 'never', 'notice', 'nature', 'next'],
'o': ['open', 'only', 'offer', 'order', 'other', 'object', 'observe'],
'p': ['play', 'place', 'plan', 'point', 'power', 'prepare', 'protect'],
'q': ['quick', 'question', 'quiet', 'quality', 'quit', 'quote', 'queue'],
'r': ['run', 'read', 'reach', 'return', 'remember', 'result', 'rise'],
's': ['see', 'say', 'start', 'show', 'seem', 'solve', 'stay'],
't': ['take', 'time', 'tell', 'try', 'turn', 'teach', 'think'],
'u': ['use', 'understand', 'until', 'update', 'upon', 'usual', 'unite'],
'v': ['very', 'view', 'visit', 'value', 'voice', 'vary', 'verify'],
'w': ['work', 'want', 'wait', 'walk', 'watch', 'write', 'win'],
'x': ['xray', 'xenon', 'xylem', 'xylophone', 'xerox', 'xenial', 'xiphoid'],
'y': ['you', 'your', 'young', 'year', 'yellow', 'yield', 'yesterday'],
'z': ['zero', 'zone', 'zebra', 'zoom', 'zinc', 'zest', 'zigzag']
}

def generate_normal_text(length=150):
    """Generate random typing practice text"""
    words = []
    current_length = 0

    while current_length < length:
        word = random.choice(COMMON_WORDS)
        words.append(word)
        current_length += len(word) + 1  # +1 for space

    return ' '.join(words[:2])  # Limit to ~30 words


def generate_weak_key_text(user_id):
    """
    Generate practice text focused on user's weak keys
    """
    weak_keys = models.get_weak_keys(user_id, limit=3)

    if not weak_keys:
        # No weak keys yet, use normal text
        return generate_normal_text()

    # Build text with weak characters
    text = []

    for weak_key in weak_keys:
        char = weak_key['character']

        # Get words containing this character
        if char in SPECIAL_WORDS:
            words = SPECIAL_WORDS[char]
        else:
            # Fall back to common words
            words = [w for w in COMMON_WORDS if char in w]

        if words:
            text.extend(random.sample(words, min(3, len(words))))

    # Add some normal words for context
    text.extend(random.sample(COMMON_WORDS, 5))

    # Shuffle and limit
    random.shuffle(text)
    return ' '.join(text[:25])


def analyze_mistakes(user_id, typed_text, original_text):
    """
    Analyze typing mistakes and log error characters
    """
    from backend.services.scoring import analyze_typing_errors

    errors = analyze_typing_errors(typed_text, original_text)

    # Log each error character
    for error in errors:
        if error['typed'] != error['expected']:
            # Log the expected character as the error
            models.log_error(user_id, error['expected'].lower())


def get_error_frequency(user_id):
    """Get error frequency for a user"""
    weak_keys = models.get_weak_keys(user_id)

    if not weak_keys:
        return None

    total_errors = sum([key['error_count'] for key in weak_keys])

    for key in weak_keys:
        key['percentage'] = (key['error_count'] / total_errors) * 100

    return weak_keys