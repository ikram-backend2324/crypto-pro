from django.contrib import admin
from .models import AnalysisResult


@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    list_display = ['algorithm', 'strength_label', 'strength_score', 'entropy_score', 'key_length', 'created_at']
    list_filter = ['algorithm', 'strength_label', 'created_at']
    search_fields = ['algorithm', 'strength_label']
    readonly_fields = ['created_at']
