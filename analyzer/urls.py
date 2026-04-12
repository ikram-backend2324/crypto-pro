from django.urls import path
from . import views

urlpatterns = [
    path('', views.analyze_view, name='analyze'),
    path('<int:pk>/', views.analysis_detail, name='analysis_detail'),
]
