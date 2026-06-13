from django.urls import path
from . import views

urlpatterns = [
    path('', views.chat_view, name='chat'),
    path('new/', views.new_session, name='chat_new'),
    path('<int:session_id>/', views.chat_view, name='chat_session'),
    path('<int:session_id>/send/', views.send_message, name='chat_send'),
    path('<int:session_id>/delete/', views.delete_session, name='chat_delete'),
]
