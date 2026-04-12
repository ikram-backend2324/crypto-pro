from django.db import models


class ComparisonRecord(models.Model):
    algorithms = models.JSONField(default=list, help_text="List of algorithm names compared")
    comparison_data = models.JSONField(default=dict, help_text="Full metric comparison data")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comparison: {', '.join(self.algorithms)} ({self.created_at.date()})"
