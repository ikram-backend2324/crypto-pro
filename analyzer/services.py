import math
import re
import binascii
from collections import Counter


def calculate_entropy(data: str) -> float:
    """Shannon entropy of a string (bits per character)."""
    if not data:
        return 0.0
    counter = Counter(data)
    length = len(data)
    entropy = -sum((count / length) * math.log2(count / length) for count in counter.values())
    return round(entropy, 4)


def char_frequency(data: str, top: int = 16) -> list:
    """Return top-N character frequencies for visualization."""
    if not data:
        return []
    counter = Counter(data)
    most = counter.most_common(top)
    total = len(data)
    return [{'char': c, 'count': n, 'pct': round(n / total * 100, 2)} for c, n in most]


def detect_patterns(key: str) -> list:
    """
    Detect weaknesses in a key string.
    Returns a list of dicts: {'code': 'pattern_xxx', 'params': {...}}
    Each code is a translation key resolved at render time.
    """
    issues = []
    if re.search(r'(.)\1{3,}', key):
        issues.append({'code': 'pattern_repeated_chars', 'params': {}})
    if re.search(r'(01|10){4,}', key):
        issues.append({'code': 'pattern_alternating_bits', 'params': {}})
    if key == key[::-1] and len(key) > 4:
        issues.append({'code': 'pattern_palindrome', 'params': {}})
    unique = len(set(key))
    low_unique = unique / max(len(key), 1)
    if low_unique < 0.3:
        issues.append({'code': 'pattern_low_diversity', 'params': {'count': unique}})
    common_weak = ['0000', 'ffff', 'aaaa', '1234', 'abcd', 'dead', 'beef']
    for w in common_weak:
        if w in key.lower():
            issues.append({'code': 'pattern_weak_substring', 'params': {'value': w}})
    return issues


def score_strength(entropy: float, key_len: int, patterns: list) -> tuple:
    """Return (score 0-100, label_code).
    label_code stays in English for badge css class matching, but is rendered via T in templates.
    """
    score = 0
    score += min(50, int(entropy / 8.0 * 50))
    if key_len >= 512:
        score += 30
    elif key_len >= 256:
        score += 25
    elif key_len >= 128:
        score += 20
    elif key_len >= 64:
        score += 12
    elif key_len >= 32:
        score += 6
    score -= len(patterns) * 7
    score = max(0, min(100, score))

    if score >= 80:
        label = 'Strong'
    elif score >= 55:
        label = 'Moderate'
    elif score >= 30:
        label = 'Weak'
    else:
        label = 'Very Weak'
    return score, label


def build_recommendations(score: int, patterns: list, key_len: int) -> list:
    """Returns list of dicts with code + params, translated at render time."""
    recs = []
    if key_len < 128:
        recs.append({'code': 'rec_min_128bit', 'params': {}})
    if key_len < 256 and key_len >= 128:
        recs.append({'code': 'rec_use_256', 'params': {}})
    if patterns:
        recs.append({'code': 'rec_avoid_predictable', 'params': {}})
    if score < 55:
        recs.append({'code': 'rec_regenerate', 'params': {}})
    if score >= 80:
        recs.append({'code': 'rec_strong_store', 'params': {}})
    recs.append({'code': 'rec_never_hardcode', 'params': {}})
    return recs


def analyze_key(algorithm: str, key_input: str) -> dict:
    """Full analysis pipeline. Returns a result dict with translatable codes."""
    cleaned = key_input.strip()
    try:
        decoded = binascii.unhexlify(cleaned.replace(' ', '').replace(':', ''))
        key_len_bits = len(decoded) * 8
        display_type = 'hex'
    except Exception:
        key_len_bits = len(cleaned) * 8
        display_type = 'text'

    entropy = calculate_entropy(cleaned)
    patterns = detect_patterns(cleaned)
    score, label = score_strength(entropy, key_len_bits, patterns)
    recs = build_recommendations(score, patterns, key_len_bits)
    freqs = char_frequency(cleaned, top=16)

    return {
        'algorithm': algorithm,
        'key_input': cleaned,
        'key_length': key_len_bits,
        'display_type': display_type,
        'entropy_score': entropy,
        'strength_score': score,
        'strength_label': label,
        'patterns_found': patterns,
        'recommendations': recs,
        'char_frequencies': freqs,
    }
