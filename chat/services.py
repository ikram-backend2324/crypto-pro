import requests
from django.conf import settings

SYSTEM_PROMPT_TEMPLATE = """You are a specialized AI research assistant for cryptographic key generation, 
analysis, and algorithms. You have deep knowledge of:
- Symmetric and asymmetric cryptography (AES, RSA, ECC, ChaCha20, etc.)
- Key generation methods and best practices
- Entropy, randomness, and security analysis
- Post-quantum cryptography (Kyber, Dilithium, SPHINCS+)
- AI-based approaches to cryptanalysis and key evaluation
- NIST standards, RFCs, and security recommendations

Answer questions clearly and technically. When relevant, mention practical implementation 
details in Python. Keep answers focused on cryptography and AI-in-security topics.

{lang_instruction}"""

LANG_INSTRUCTIONS = {
    'en': "Always respond in English.",
    'ru': "Всегда отвечай на русском языке.",
    'uz': "Har doim o'zbek tilida javob bering.",
}


def get_system_prompt(lang: str = 'en') -> str:
    lang_instruction = LANG_INSTRUCTIONS.get(lang, LANG_INSTRUCTIONS['en'])
    return SYSTEM_PROMPT_TEMPLATE.format(lang_instruction=lang_instruction)


def chat_with_openrouter(messages: list, lang: str = 'en') -> str:
    """
    Send a list of {role, content} messages to OpenRouter.
    Returns the assistant reply as a string.
    """
    api_key = settings.OPENROUTER_API_KEY
    model = settings.OPENROUTER_MODEL

    if not api_key:
        return "⚠️ OpenRouter API key is not configured. Please add OPENROUTER_API_KEY to your .env file."

    system_prompt = get_system_prompt(lang)

    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system_prompt}] + messages,
        "max_tokens": 1024,
        "temperature": 0.7,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Crypto Key Research Tool",
    }

    try:
        response = requests.post(
            f"{settings.OPENROUTER_BASE_URL}/chat/completions",
            json=payload,
            headers=headers,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        return data['choices'][0]['message']['content']
    except requests.exceptions.Timeout:
        return "⚠️ Request timed out. Please try again."
    except requests.exceptions.HTTPError as e:
        return f"⚠️ API error: {e.response.status_code} — {e.response.text[:200]}"
    except Exception as e:
        return f"⚠️ Unexpected error: {str(e)}"


def build_message_history(session) -> list:
    """Convert ChatMessage queryset to OpenRouter message format."""
    return [
        {"role": msg.role, "content": msg.content}
        for msg in session.messages.all()
    ]