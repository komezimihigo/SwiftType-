"""
Scoring system for typing tests
Calculates WPM, accuracy, and error count
"""


def calculate_score(typed_text, original_text, time_seconds):
    """
    Calculate typing test score

    WPM = (characters typed / 5) / time_in_minutes
    Accuracy = (correct_characters / total_characters) * 100
    """

    if time_seconds <= 0:
        return {
            'wpm': 0,
            'raw_wpm': 0,
            'accuracy': 0,
            'errors': 0
        }

    # Convert time to minutes
    time_minutes = time_seconds / 60

    # Calculate raw WPM (total characters / 5 / minutes)
    total_chars = len(typed_text)
    raw_wpm = (total_chars / 5) / time_minutes if time_minutes > 0 else 0

    # Compare texts character by character
    correct_chars = 0
    errors = 0
    min_length = min(len(typed_text), len(original_text))

    for i in range(min_length):
        if typed_text[i] == original_text[i]:
            correct_chars += 1
        else:
            errors += 1

    # Account for extra or missing characters
    errors += abs(len(typed_text) - len(original_text))

    # Calculate accuracy
    if len(original_text) > 0:
        accuracy = (correct_chars / len(original_text)) * 100
    else:
        accuracy = 0

    # Calculate adjusted WPM (penalize for errors)
    # Adjusted WPM = Raw WPM - (errors / time_in_minutes)
    adjusted_wpm = max(0, raw_wpm - (errors / time_minutes))

    return {
        'wpm': round(adjusted_wpm, 2),
        'raw_wpm': round(raw_wpm, 2),
        'accuracy': round(accuracy, 2),
        'errors': errors
    }


def analyze_typing_errors(typed_text, original_text):
    """
    Analyze specific character errors
    Returns list of mistyped characters
    """
    errors = []
    min_length = min(len(typed_text), len(original_text))

    for i in range(min_length):
        if typed_text[i] != original_text[i]:
            errors.append({
                'position': i,
                'expected': original_text[i],
                'typed': typed_text[i]
            })

    # Add missing characters
    if len(original_text) > len(typed_text):
        for i in range(len(typed_text), len(original_text)):
            errors.append({
                'position': i,
                'expected': original_text[i],
                'typed': ''
            })

    return errors

