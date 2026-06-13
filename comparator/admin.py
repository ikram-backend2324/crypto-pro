from django.contrib import admin
from .models import ComparisonRecord


@admin.register(ComparisonRecord)
class ComparisonRecordAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'created_at']
    list_filter = ['created_at']
    readonly_fields = ['created_at']
