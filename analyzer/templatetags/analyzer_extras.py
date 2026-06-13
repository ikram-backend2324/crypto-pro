"""
Template filters for translating analyzer codes (patterns / recommendations / strength labels).
"""
from django import template
from core.translations import STRENGTH_LABEL_KEYS

register = template.Library()


@register.filter
def trans_code(item, translations):
    """
    Translate a {'code': 'pattern_xxx', 'params': {...}} dict using the provided
    T translation dict. Supports backwards compatibility with legacy string entries.
    """
    if isinstance(item, dict):
        code = item.get('code', '')
        params = item.get('params', {}) or {}
        template_str = translations.get(code, code)
        try:
            return template_str.format(**params)
        except (KeyError, IndexError, ValueError):
            return template_str
    # Legacy: items stored as plain English strings
    return str(item)


@register.filter
def trans_strength(label, translations):
    """Translate the strength label (stored English) to the user's language."""
    if not label:
        return ''
    key = STRENGTH_LABEL_KEYS.get(label, 'label_unknown')
    return translations.get(key, label)


@register.filter
def strength_class(label):
    """Map strength label to css class fragment."""
    mapping = {
        'Strong': 'strong',
        'Moderate': 'moderate',
        'Weak': 'weak',
        'Very Weak': 'very-weak',
    }
    return mapping.get(label, 'very-weak')
