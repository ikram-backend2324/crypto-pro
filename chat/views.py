from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from .models import ChatSession, ChatMessage
from .services import chat_with_openrouter, build_message_history
import json


@login_required
def chat_view(request, session_id=None):
    sessions = ChatSession.objects.all()

    if session_id:
        session = get_object_or_404(ChatSession, pk=session_id)
    else:
        session = None

    return render(request, 'chat/chat.html', {
        'sessions': sessions,
        'current_session': session,
        'messages': session.messages.all() if session else [],
    })


@login_required
def new_session(request):
    session = ChatSession.objects.create(title="New Session")
    return redirect('chat_session', session_id=session.pk)


@login_required
@require_POST
def send_message(request, session_id):
    session = get_object_or_404(ChatSession, pk=session_id)

    try:
        body = json.loads(request.body)
        user_content = body.get('message', '').strip()
    except Exception:
        return JsonResponse({'error': 'Invalid request'}, status=400)

    if not user_content:
        return JsonResponse({'error': 'Empty message'}, status=400)

    ChatMessage.objects.create(session=session, role='user', content=user_content)

    if session.messages.count() == 1:
        session.title = user_content[:60]
        session.save()

    # Get user's language from session
    lang = request.session.get('lang', 'en')

    history = build_message_history(session)
    reply = chat_with_openrouter(history, lang=lang)

    ChatMessage.objects.create(session=session, role='assistant', content=reply)

    return JsonResponse({'reply': reply})


@login_required
def delete_session(request, session_id):
    session = get_object_or_404(ChatSession, pk=session_id)
    session.delete()
    return redirect('chat')