from django.shortcuts import render
from analyzer.models import AnalysisResult
from comparator.models import ComparisonRecord
from chat.models import ChatSession


def home(request):
    context = {
        'total_analyses': AnalysisResult.objects.count(),
        'total_comparisons': ComparisonRecord.objects.count(),
        'total_chats': ChatSession.objects.count(),
        'recent_analyses': AnalysisResult.objects.order_by('-created_at')[:5],
    }
    return render(request, 'core/home.html', context)
