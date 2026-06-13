from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from analyzer.models import AnalysisResult
from comparator.models import ComparisonRecord
from chat.models import ChatSession
from .translations import TRANSLATIONS


@login_required
def home(request):
    context = {
        'total_analyses': AnalysisResult.objects.count(),
        'total_comparisons': ComparisonRecord.objects.count(),
        'total_chats': ChatSession.objects.count(),
        'recent_analyses': AnalysisResult.objects.order_by('-created_at')[:5],
    }
    return render(request, 'core/home.html', context)

def set_language(request):
    """Store chosen language in session and redirect back."""
    lang = request.GET.get('lang', 'en')
    if lang not in TRANSLATIONS:
        lang = 'en'
    request.session['lang'] = lang
    next_url = request.GET.get('next', request.META.get('HTTP_REFERER', '/'))
    return redirect(next_url)