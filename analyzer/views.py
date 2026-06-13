import json
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import AnalysisResult
from .services import analyze_key

ALGORITHM_CHOICES = ['RSA', 'AES', 'ECC', 'ChaCha20', '3DES', 'OTHER']


@login_required
def analyze_view(request):
    result = None
    error = None

    if request.method == 'POST':
        algorithm = request.POST.get('algorithm', 'AES')
        key_input = request.POST.get('key_input', '').strip()

        if not key_input:
            lang = request.session.get('lang', 'en')
            error_messages = {
                'en': 'Please enter a key to analyze.',
                'ru': 'Пожалуйста, введите ключ для анализа.',
                'uz': "Iltimos, tahlil qilish uchun kalit kiriting.",
            }
            error = error_messages.get(lang, error_messages['en'])
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
                char_frequencies=data['char_frequencies'],
            )
            result = obj

    history = AnalysisResult.objects.order_by('-created_at')[:10]

    # Serialize result for the 3D visualization JS
    result_json = None
    if result:
        result_json = json.dumps({
            'algorithm': result.algorithm,
            'key_length': result.key_length,
            'entropy_score': result.entropy_score,
            'strength_score': result.strength_score,
            'strength_label': result.strength_label,
            'patterns_count': len(result.patterns_found or []),
            'char_frequencies': result.char_frequencies or [],
        })

    return render(request, 'analyzer/analyze.html', {
        'result': result,
        'result_json': result_json,
        'error': error,
        'algorithms': ALGORITHM_CHOICES,
        'history': history,
    })


@login_required
def analysis_detail(request, pk):
    obj = get_object_or_404(AnalysisResult, pk=pk)
    result_json = json.dumps({
        'algorithm': obj.algorithm,
        'key_length': obj.key_length,
        'entropy_score': obj.entropy_score,
        'strength_score': obj.strength_score,
        'strength_label': obj.strength_label,
        'patterns_count': len(obj.patterns_found or []),
        'char_frequencies': obj.char_frequencies or [],
    })
    return render(request, 'analyzer/detail.html', {
        'result': obj,
        'result_json': result_json,
    })
