from django.shortcuts import render
from .services import get_algorithm_names, compare_algorithms, ALGORITHM_DATA
from .models import ComparisonRecord


def compare_view(request):
    all_algorithms = get_algorithm_names()
    comparison = None
    selected = []

    if request.method == 'POST':
        selected = request.POST.getlist('algorithms')
        if len(selected) < 2:
            error = "Please select at least 2 algorithms to compare."
            return render(request, 'comparator/compare.html', {
                'all_algorithms': all_algorithms,
                'error': error,
                'algorithm_data': ALGORITHM_DATA,
            })
        comparison = compare_algorithms(selected)
        # Save to DB
        ComparisonRecord.objects.create(
            algorithms=selected,
            comparison_data=comparison.get('table_rows', []),
        )

    history = ComparisonRecord.objects.order_by('-created_at')[:5]
    return render(request, 'comparator/compare.html', {
        'all_algorithms': all_algorithms,
        'comparison': comparison,
        'selected': selected,
        'history': history,
        'algorithm_data': ALGORITHM_DATA,
    })
