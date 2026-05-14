from .translations import get_translations, LANG_NAMES, TRANSLATIONS


def language_context(request):
    """
    Injects current language code and full translation dict into every template.
    Language is stored in request.session['lang'], defaulting to 'en'.
    """
    lang = request.session.get('lang', 'en')
    if lang not in TRANSLATIONS:
        lang = 'en'

    return {
        'lang': lang,
        'T': get_translations(lang),
        'LANG_NAMES': LANG_NAMES,
        'ALL_LANGS': list(TRANSLATIONS.keys()),
    }