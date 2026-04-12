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


def detect_patterns(key: str) -> list:
    """Detect weaknesses in a key string."""
    issues = []
    if re.search(r'(.)\1{3,}', key):
        issues.append("Repeated characters detected (e.g. 'aaaa')")
    if re.search(r'(01|10){4,}', key):
        issues.append("Alternating bit pattern detected")
    if key == key[::-1] and len(key) > 4:
        issues.append("Key is a palindrome")
    low_unique = len(set(key)) / max(len(key), 1)
    if low_unique < 0.3:
        issues.append(f"Low character diversity ({len(set(key))} unique chars)")
    common_weak = ['0000', 'ffff', 'aaaa', '1234', 'abcd', 'dead', 'beef']
    for w in common_weak:
        if w in key.lower():
            issues.append(f"Contains weak pattern: '{w}'")
    return issues


def score_strength(entropy: float, key_len: int, patterns: list) -> tuple:
    """Return (score 0-100, label)."""
    score = 0
    # Entropy contribution (max 50 pts)
    score += min(50, int(entropy / 8.0 * 50))
    # Length contribution (max 30 pts)
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
    # Pattern penalty (max -20 pts)
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
    recs = []
    if key_len < 128:
        recs.append("Use at least 128-bit (16-byte) keys for symmetric encryption.")
    if key_len < 256 and key_len >= 128:
        recs.append("Consider 256-bit keys for long-term security.")
    if patterns:
        recs.append("Avoid predictable patterns — use a cryptographically secure random generator (os.urandom or secrets module).")
    if score < 55:
        recs.append("Regenerate the key using a proper CSPRNG (Cryptographically Secure Pseudo-Random Number Generator).")
    if score >= 80:
        recs.append("Key looks strong. Store it securely using a key management system or HSM.")
    recs.append("Never hardcode keys in source code. Use environment variables or a secrets vault.")
    return recs


def analyze_key(algorithm: str, key_input: str) -> dict:
    """Full analysis pipeline. Returns a result dict."""
    cleaned = key_input.strip()
    # Try to detect hex and convert for length calculation
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
    }
