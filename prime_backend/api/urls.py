from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('auth/login/', views.login, name='login'),
    path('auth/register/', views.register, name='register'),
    
    # Users
    path('users/', views.get_all_users, name='all_users'),
    path('users/<str:user_id>/', views.get_user, name='get_user'),
    path('users/<str:user_id>/update/', views.update_user, name='update_user'),
    path('users/<str:user_id>/delete/', views.delete_user, name='delete_user'),
    
    # Projects
    path('projects/', views.get_projects, name='projects'),
    path('projects/create/', views.create_project, name='create_project'),
    path('projects/<str:project_id>/', views.get_project, name='get_project'),
    path('projects/<str:project_id>/download-zip/', views.download_project_zip, name='download_project_zip'),
    path('projects/<str:project_id>/update/', views.update_project, name='update_project'),
    path('projects/<str:project_id>/delete/', views.delete_project, name='delete_project'),
    path('projects/<str:project_id>/messages/', views.get_project_messages, name='get_project_messages'),
    path('projects/<str:project_id>/messages/create/', views.create_project_message, name='create_project_message'),
    path('projects/owner/<str:owner_id>/', views.get_projects_by_owner, name='projects_by_owner'),
    
    # Access Requests
    path('access-requests/', views.get_access_requests, name='access_requests'),
    path('access-requests/project/<str:project_id>/', views.get_access_requests_for_project, name='access_requests_for_project'),
    path('access-requests/create/', views.create_access_request, name='create_access_request'),
    path('access-requests/<str:request_id>/approve/', views.approve_access_request, name='approve_access_request'),
    path('access-requests/<str:request_id>/reject/', views.reject_access_request, name='reject_access_request'),
    
    # Landing Content
    path('landing-content/', views.get_landing_content, name='landing_content'),
    path('landing-content/update/', views.update_landing_content, name='update_landing_content'),

    # Notifications
    path('notifications/<str:user_id>/', views.get_notifications, name='get_notifications'),
    path('notifications/<str:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/<str:notification_id>/delete/', views.delete_notification, name='delete_notification'),
    path('notifications/user/<str:user_id>/clear/', views.clear_notifications, name='clear_notifications'),
]
