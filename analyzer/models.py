from django.db import models


class AnalysisResult(models.Model):
    ALGORITHM_CHOICES = [
        ('RSA', 'RSA'),
        ('AES', 'AES'),
        ('ECC', 'ECC'),
        ('DES', 'DES'),
        ('3DES', 'Triple DES'),
        ('ChaCha20', 'ChaCha20'),
        ('OTHER', 'Other'),
    ]

    algorithm = models.CharField(max_length=20, choices=ALGORITHM_CHOICES)
    key_input = models.TextField(help_text="The key or seed to analyze")
    key_length = models.IntegerField(default=0)
    entropy_score = models.FloatField(default=0.0)
    strength_score = models.IntegerField(default=0, help_text="0-100")
    strength_label = models.CharField(max_length=20, default='Unknown')
    patterns_found = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    char_frequencies = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.algorithm} analysis – {self.strength_label} ({self.created_at.date()})"
