from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import AnalysisResult
from .services import analyze_key

ALGORITHM_CHOICES = ['RSA', 'AES', 'ECC', 'ChaCha20', '3DES', 'OTHER']


def analyze_view(request):
    result = None
    error = None

    if request.method == 'POST':
        algorithm = request.POST.get('algorithm', 'AES')
        key_input = request.POST.get('key_input', '').strip()

        if not key_input:
            error = "Please enter a key to analyze."
        else:
            data = analyze_key(algorithm, key_input)
            obj = AnalysisResult.objects.create(
                algorithm=data['algorithm'],
                key_input=data['key_input'],
                key_length=data['key_length'],
                entropy_score=data['entropy_score'],
                strength_score=data['strength_score'],
                strength_label=data['strength_label'],
                patterns_found=data['patterns_found'],
                recommendations=data['recommendations'],
            )
            result = obj

    history = AnalysisResult.objects.order_by('-created_at')[:10]
    return render(request, 'analyzer/analyze.html', {
        'result': result,
        'error': error,
        'algorithms': ALGORITHM_CHOICES,
        'history': history,
    })


def analysis_detail(request, pk):
    obj = get_object_or_404(AnalysisResult, pk=pk)
    return render(request, 'analyzer/detail.html', {'result': obj})
