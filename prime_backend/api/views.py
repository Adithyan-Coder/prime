from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
import json
from datetime import datetime
import uuid
import os
import time
import base64
from io import BytesIO
from zipfile import ZipFile, ZIP_DEFLATED
from supabase import create_client, Client

# Initialize Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY or os.getenv('SUPABASE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
NOTIFICATIONS_TABLE_AVAILABLE = True
PROJECT_MESSAGES_TABLE_AVAILABLE = True
PROJECT_LIST_SELECT = 'id,title,abstract,domains,year,license,techstack,status,owner,ownerid,createdat,lastupdated,approvedfacultyids,approvalstatus'
LANDING_CONTENT_SINGLETON_ID = 'global-landing-content'
README_FILE_ID = '__project_readme__'
README_FILE_NAME = 'README.md'


def execute_with_retry(query_builder, retries=3, delay=0.35):
    """Retry transient Supabase query failures."""
    last_error = None
    for attempt in range(retries):
        try:
            return query_builder.execute()
        except Exception as exc:
            last_error = exc
            if attempt == retries - 1:
                raise
            time.sleep(delay * (attempt + 1))
    raise last_error


def create_notification(user_id, title, message, notification_type='general', project_id=None):
    """Create a notification for a user."""
    if not user_id:
        return

    global NOTIFICATIONS_TABLE_AVAILABLE
    if not NOTIFICATIONS_TABLE_AVAILABLE:
        return

    try:
        notification = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'title': title,
            'message': message,
            'type': notification_type,
            'project_id': project_id,
            'is_read': False,
            'created_at': datetime.utcnow().isoformat()
        }
        supabase.table('notifications').insert(notification).execute()
    except Exception as exc:
        if 'public.notifications' in str(exc):
            NOTIFICATIONS_TABLE_AVAILABLE = False
        # Notifications should never block core project workflows.
        print(f'Notification creation failed for user {user_id}: {exc}')
        return


def normalize_identifier(value):
    return (value or '').strip().lower()


def fetch_all_users_basic():
    try:
        response = execute_with_retry(supabase.table('users').select('id,username,email,name'))
        return response.data or []
    except Exception as exc:
        print(f'Failed to fetch users for notification matching: {exc}')
        return []


def resolve_user_ids_for_team_member(member_name=None, member_email=None, users_cache=None):
    """Match team members to app users, using username as the canonical email identifier."""
    matched_ids = set()
    normalized_name = normalize_identifier(member_name)
    normalized_email = normalize_identifier(member_email)
    users = users_cache if users_cache is not None else fetch_all_users_basic()

    for user in users:
        user_id = user.get('id')
        if not user_id:
            continue

        user_name = normalize_identifier(user.get('name'))
        username = normalize_identifier(user.get('username'))
        user_email = normalize_identifier(user.get('email'))

        # In this project, users.username stores the user's mail ID.
        if normalized_email and normalized_email == username:
            matched_ids.add(user_id)
            continue

        # Fallbacks for older or mixed records.
        if normalized_email and normalized_email == user_email:
            matched_ids.add(user_id)
            continue

        if normalized_name and normalized_name in {user_name, username}:
            matched_ids.add(user_id)

    return matched_ids


def collect_project_notification_recipients(project, team_members, exclude_user_id=None):
    """Collect owner + matched teammates, excluding the acting user."""
    recipient_ids = set()
    users_cache = fetch_all_users_basic()

    owner_id = project.get('ownerId')
    owner_name = project.get('owner')
    if owner_id and owner_id != exclude_user_id:
        recipient_ids.add(owner_id)
    elif owner_name:
        recipient_ids.update(resolve_user_ids_for_team_member(member_name=owner_name, users_cache=users_cache))

    for member in team_members or []:
        recipient_ids.update(
            resolve_user_ids_for_team_member(
                member_name=member.get('name'),
                member_email=member.get('email'),
                users_cache=users_cache,
            )
        )

    recipient_ids.discard(exclude_user_id)
    return recipient_ids


def normalize_uploaded_file_list(uploaded_files):
    return uploaded_files if isinstance(uploaded_files, list) else []


def extract_project_readme_content(project):
    direct_value = project.get('readmecontent') or project.get('readmeContent') or project.get('readme')
    if isinstance(direct_value, str):
        return direct_value

    for file in normalize_uploaded_file_list(project.get('uploadedfiles') or project.get('uploadedFiles')):
        if not isinstance(file, dict):
            continue

        if file.get('id') == README_FILE_ID or file.get('name') == README_FILE_NAME:
            return decode_uploaded_file_content(file.get('content')).decode('utf-8', errors='ignore')

    return ''


def upsert_project_readme_file(uploaded_files, readme_content, timestamp=None, actor_id=None, actor_name=None):
    safe_timestamp = timestamp or datetime.utcnow().isoformat()
    next_files = []

    for file in normalize_uploaded_file_list(uploaded_files):
        if not isinstance(file, dict):
            next_files.append(file)
            continue

        if file.get('id') == README_FILE_ID or file.get('name') == README_FILE_NAME:
            continue

        next_files.append(file)

    next_files.append({
        'id': README_FILE_ID,
        'name': README_FILE_NAME,
        'size': len((readme_content or '').encode('utf-8')),
        'type': 'text/markdown',
        'uploadedAt': safe_timestamp,
        'uploadedById': actor_id,
        'uploadedByName': actor_name,
        'path': '',
        'content': base64.b64encode((readme_content or '').encode('utf-8')).decode('utf-8'),
    })

    return next_files


def sanitize_archive_name(value, fallback='project'):
    safe_value = ''.join(char if char.isalnum() or char in {'-', '_'} else '_' for char in (value or fallback))
    return safe_value.strip('_') or fallback


def sanitize_archive_file_name(value, fallback='file'):
    safe_value = ''.join(char if char.isalnum() or char in {'-', '_', '.'} else '_' for char in (value or fallback))
    return safe_value.strip('_') or fallback


def decode_uploaded_file_content(value):
    if not value:
        return b''

    try:
        return base64.b64decode(value)
    except Exception:
        return str(value).encode('utf-8')


def normalize_project_message(message):
    return {
        'id': message.get('id'),
        'projectId': message.get('project_id') or message.get('projectId'),
        'senderId': message.get('sender_id') or message.get('senderId'),
        'senderName': message.get('sender_name') or message.get('senderName'),
        'senderEmail': message.get('sender_email') or message.get('senderEmail'),
        'senderRole': message.get('sender_role') or message.get('senderRole'),
        'message': message.get('message') or '',
        'createdAt': message.get('created_at') or message.get('createdAt') or datetime.utcnow().isoformat(),
    }


def fetch_user_basic(user_id):
    if not user_id:
        return None

    try:
        response = execute_with_retry(supabase.table('users').select('id,username,email,name,role').eq('id', user_id))
        if response.data:
            return response.data[0]
    except Exception as exc:
        print(f'Failed to fetch user {user_id}: {exc}')

    return None


def fetch_user_by_identity(identifier):
    normalized_identifier = normalize_identifier(identifier)
    if not normalized_identifier:
        return None

    users = fetch_all_users_basic()
    for user in users:
        username = normalize_identifier(user.get('username'))
        email = normalize_identifier(user.get('email'))
        name = normalize_identifier(user.get('name'))
        if normalized_identifier in {username, email, name}:
            return user

    return None


def is_project_teammate(project_id, user_id):
    """Restrict team chat to the project owner and explicit team members only."""
    if not project_id or not user_id:
        return False, None, None

    try:
        project_response = execute_with_retry(
            supabase.table('projects').select('id,owner,ownerid').eq('id', project_id)
        )
        if not project_response.data:
            return False, None, None

        project = project_response.data[0]
        if project.get('ownerid') == user_id:
            return True, project, fetch_user_basic(user_id)

        user = fetch_user_basic(user_id)
        if not user:
            return False, project, None

        team_response = execute_with_retry(
            supabase.table('team_members').select('name,email').eq('project_id', project_id)
        )
        team_members = team_response.data or []

        normalized_name = normalize_identifier(user.get('name'))
        normalized_username = normalize_identifier(user.get('username'))
        normalized_email = normalize_identifier(user.get('email'))

        for member in team_members:
            member_name = normalize_identifier(member.get('name'))
            member_email = normalize_identifier(member.get('email'))
            if normalized_email and normalized_email == member_email:
                return True, project, user
            if normalized_username and normalized_username == member_email:
                return True, project, user
            if normalized_name and normalized_name == member_name:
                return True, project, user

        return False, project, user
    except Exception as exc:
        print(f'Failed to verify team membership for user {user_id} on project {project_id}: {exc}')
        return False, None, None


def get_uploaded_file_ids(uploaded_files):
    return {
        file.get('id') for file in normalize_uploaded_file_list(uploaded_files)
        if isinstance(file, dict) and file.get('id')
    }


def merge_uploaded_file_lists(existing_uploaded_files, incoming_uploaded_files):
    """Append new files while preserving existing entries, keyed by file id when present."""
    merged_files = []
    indexed_files = {}

    for file in normalize_uploaded_file_list(existing_uploaded_files):
        if isinstance(file, dict) and file.get('id'):
            indexed_files[file['id']] = dict(file)
        else:
            merged_files.append(file)

    for file in normalize_uploaded_file_list(incoming_uploaded_files):
        if isinstance(file, dict) and file.get('id'):
            indexed_files[file['id']] = dict(file)
        else:
            merged_files.append(file)

    merged_files.extend(indexed_files.values())
    return merged_files


def normalize_landing_content(record):
    legacy_bundle = record.get('features') if isinstance(record.get('features'), dict) else {}
    bundled_features = legacy_bundle.get('features') if isinstance(legacy_bundle.get('features'), list) else None
    bundled_stats = legacy_bundle.get('stats') if isinstance(legacy_bundle.get('stats'), list) else None
    bundled_how_it_works = legacy_bundle.get('howItWorks') if isinstance(legacy_bundle.get('howItWorks'), list) else None
    bundled_cta = legacy_bundle.get('cta') if isinstance(legacy_bundle.get('cta'), dict) else {}

    hero_record = record.get('hero')
    if not isinstance(hero_record, dict):
        hero_record = {}

    cta_record = record.get('cta')
    if not isinstance(cta_record, dict):
        cta_record = {}

    return {
        'hero': {
            'badge': hero_record.get('badge') or legacy_bundle.get('heroBadge') or record.get('badge', ''),
            'title': hero_record.get('title') or record.get('title', ''),
            'highlight': hero_record.get('highlight') or record.get('highlight') or record.get('subtitle', ''),
            'description': hero_record.get('description') or record.get('description', ''),
        },
        'stats': record.get('stats') or bundled_stats or [],
        'features': bundled_features or (record.get('features') if isinstance(record.get('features'), list) else []) or [],
        'howItWorks': record.get('howItWorks') or record.get('howitworks') or bundled_how_it_works or [],
        'cta': {
            'title': cta_record.get('title') or bundled_cta.get('title') or record.get('cta_title', ''),
            'description': cta_record.get('description') or bundled_cta.get('description') or record.get('cta_description', ''),
        },
    }


def build_modern_landing_content_payload(request_data):
    payload = {
        'hero': request_data.get('hero'),
        'stats': request_data.get('stats'),
        'features': request_data.get('features'),
        'howItWorks': request_data.get('howItWorks') or request_data.get('howitworks'),
        'cta': request_data.get('cta'),
    }
    return {key: value for key, value in payload.items() if value is not None}


def build_legacy_landing_content_payload(request_data):
    hero = request_data.get('hero') or {}
    cta = request_data.get('cta') or {}
    payload = {
        'title': hero.get('title'),
        'subtitle': hero.get('highlight'),
        'description': hero.get('description'),
        'features': {
            'heroBadge': hero.get('badge', ''),
            'features': request_data.get('features') or [],
            'stats': request_data.get('stats') or [],
            'howItWorks': request_data.get('howItWorks') or request_data.get('howitworks') or [],
            'cta': {
                'title': cta.get('title', ''),
                'description': cta.get('description', ''),
            },
        },
    }

    return {key: value for key, value in payload.items() if value is not None}


def execute_landing_content_write(existing_row, payload, drop_missing_columns=True):
    """Persist landing content while tolerating older landing_content table shapes."""
    pending_payload = dict(payload)

    while True:
        try:
            if existing_row:
                return supabase.table('landing_content').update(pending_payload).eq('id', existing_row['id']).execute()

            payload_with_id = {'id': LANDING_CONTENT_SINGLETON_ID, **pending_payload}
            return supabase.table('landing_content').insert(payload_with_id).execute()
        except Exception as exc:
            if not drop_missing_columns:
                raise

            error_text = str(exc)

            if "Could not find the '" in error_text and "' column of 'landing_content'" in error_text:
                missing_column = error_text.split("Could not find the '", 1)[1].split("' column of 'landing_content'", 1)[0]
                if missing_column in pending_payload:
                    pending_payload.pop(missing_column, None)
                    continue

            raise


def get_existing_landing_content_row():
    singleton_response = supabase.table('landing_content').select('*').eq('id', LANDING_CONTENT_SINGLETON_ID).limit(1).execute()
    if singleton_response.data:
        return singleton_response.data[0]

    fallback_response = supabase.table('landing_content').select('*').limit(1).execute()
    if fallback_response.data:
        return fallback_response.data[0]

    return None

# ========================
# AUTHENTICATION ENDPOINTS
# ========================

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login endpoint"""
    username = request.data.get('username')
    password = request.data.get('password')
    role = request.data.get('role', 'student')
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        response = supabase.table('users').select('*').eq('username', username).execute()
        if response.data:
            user = response.data[0]
            if user.get('password') != password:
                return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

            user_response = {
                'id': user['id'],
                'username': user['username'],
                'email': user.get('email', ''),
                'name': user.get('name', user['username']),
                'role': user.get('role', role)
            }
            return Response(user_response, status=status.HTTP_200_OK)

        return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register endpoint"""
    username = request.data.get('username')
    password = request.data.get('password')
    name = request.data.get('name')
    role = request.data.get('role', 'student')
    
    if not all([username, password, name]):
        return Response({'error': 'Username, password, and name required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        existing = supabase.table('users').select('*').eq('username', username).execute()
        if existing.data:
            return Response({'error': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        new_user = {
            'id': str(uuid.uuid4()),
            'username': username,
            'email': username if '@' in username else '',
            'password': password,
            'name': name,
            'role': role,
            'created_at': datetime.utcnow().isoformat()
        }
        supabase.table('users').insert(new_user).execute()
        user_response = {
            'id': new_user['id'],
            'username': new_user['username'],
            'email': new_user.get('email', ''),
            'name': new_user['name'],
            'role': new_user['role']
        }
        return Response(user_response, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ========================
# USERS ENDPOINTS
# ========================

@api_view(['GET'])
def get_user(request, user_id):
    """Get user by ID"""
    try:
        response = supabase.table('users').select('*').eq('id', user_id).execute()
        if response.data:
            return Response(response.data[0], status=status.HTTP_200_OK)
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_all_users(request):
    """Get all users"""
    try:
        response = supabase.table('users').select('*').execute()
        return Response(response.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_user(request, user_id):
    """Get user by ID"""
    try:
        response = supabase.table('users').select('*').eq('id', user_id).execute()
        if response.data:
            return Response(response.data[0], status=status.HTTP_200_OK)
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([AllowAny])
def update_user(request, user_id):
    """Update user endpoint"""
    try:
        # Get user from Supabase
        response = supabase.table('users').select('*').eq('id', user_id).execute()
        if not response.data:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        user = response.data[0]
        
        # Update fields
        updated_data = {}
        for field in ['username', 'email', 'name', 'role']:
            if field in request.data:
                updated_data[field] = request.data[field]
        
        if updated_data:
            supabase.table('users').update(updated_data).eq('id', user_id).execute()
            # Return updated user
            updated_user = supabase.table('users').select('*').eq('id', user_id).execute().data[0]
            user_response = {
                'id': updated_user['id'],
                'username': updated_user['username'],
                'email': updated_user.get('email', ''),
                'name': updated_user.get('name', updated_user['username']),
                'role': updated_user.get('role', 'student')
            }
            return Response(user_response, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'No fields to update'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_user(request, user_id):
    """Delete a user and related records that reference the user directly."""
    try:
        user_response = supabase.table('users').select('*').eq('id', user_id).execute()
        if not user_response.data:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        user = user_response.data[0]
        user_email = normalize_identifier(user.get('email') or user.get('username'))
        user_name = normalize_identifier(user.get('name'))

        owned_projects_response = supabase.table('projects').select('id').eq('ownerid', user_id).execute()
        owned_project_ids = [project.get('id') for project in (owned_projects_response.data or []) if project.get('id')]

        for project_id in owned_project_ids:
            supabase.table('team_members').delete().eq('project_id', project_id).execute()
            supabase.table('access_requests').delete().eq('project_id', project_id).execute()
            try:
                supabase.table('project_messages').delete().eq('project_id', project_id).execute()
            except Exception:
                pass
            supabase.table('projects').delete().eq('id', project_id).execute()

        projects_response = supabase.table('projects').select('id,approvedfacultyids').execute()
        for project in projects_response.data or []:
            approved_ids = project.get('approvedfacultyids')
            if isinstance(approved_ids, list) and user_id in approved_ids:
                next_approved_ids = [approved_id for approved_id in approved_ids if approved_id != user_id]
                supabase.table('projects').update({'approvedfacultyids': next_approved_ids}).eq('id', project['id']).execute()

        if user_email:
            supabase.table('team_members').delete().eq('email', user_email).execute()
        if user_name:
            supabase.table('team_members').delete().eq('name', user.get('name')).execute()

        supabase.table('access_requests').delete().eq('faculty_id', user_id).execute()
        supabase.table('notifications').delete().eq('user_id', user_id).execute()
        try:
            supabase.table('project_messages').delete().eq('sender_id', user_id).execute()
        except Exception:
            pass
        supabase.table('users').delete().eq('id', user_id).execute()
        return Response({'message': 'User deleted'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========================
# PROJECTS ENDPOINTS
# ========================

def normalize_project(project):
    uploaded_files = project.get('uploadedfiles') or project.get('uploadedFiles') or []
    return {
        'id': project.get('id'),
        'title': project.get('title'),
        'abstract': project.get('abstract'),
        'domains': project.get('domains') or project.get('domains', []),
        'year': project.get('year'),
        'license': project.get('license'),
        'techStack': project.get('techstack') or project.get('techStack') or [],
        'status': project.get('status'),
        'owner': project.get('owner'),
        'ownerId': project.get('ownerid') or project.get('ownerId'),
        'createdAt': project.get('createdat') or project.get('createdAt'),
        'lastUpdated': project.get('lastupdated') or project.get('lastUpdated'),
        'approvedFacultyIds': project.get('approvedfacultyids') or project.get('approvedFacultyIds') or [],
        'approvalStatus': project.get('approvalstatus') or project.get('approvalStatus'),
        'teamMembers': project.get('teamMembers', []),
        'uploadedFiles': uploaded_files,
        'readmeContent': extract_project_readme_content({
            **project,
            'uploadedfiles': uploaded_files,
            'uploadedFiles': uploaded_files,
        }),
    }


def strip_uploaded_file_content(uploaded_files):
    """Keep uploaded file metadata but omit heavy inline content for list responses."""
    cleaned_files = []
    for file in uploaded_files or []:
        if isinstance(file, dict):
            cleaned_file = dict(file)
            cleaned_file.pop('content', None)
            cleaned_files.append(cleaned_file)
        else:
            cleaned_files.append(file)
    return cleaned_files


def strip_uploaded_files_for_list(uploaded_files):
    """Project list pages don't need uploaded file payloads at all."""
    return []


def fetch_team_members_grouped(project_ids):
    """Fetch team members for many projects in one query and group them by project_id."""
    grouped = {project_id: [] for project_id in project_ids}
    if not project_ids:
        return grouped

    try:
        response = execute_with_retry(
            supabase.table('team_members').select('*').in_('project_id', project_ids)
        )
        for member in response.data or []:
            project_id = member.get('project_id')
            if project_id not in grouped:
                grouped[project_id] = []
            grouped[project_id].append(member)
    except Exception as exc:
        print(f'Batch team member fetch failed: {exc}')

    return grouped


@api_view(['GET'])
def get_projects(request):
    """Get all projects"""
    try:
        response = execute_with_retry(supabase.table('projects').select(PROJECT_LIST_SELECT))
        project_rows = response.data or []
        team_members_by_project = fetch_team_members_grouped([project.get('id') for project in project_rows if project.get('id')])
        projects = []
        for project in project_rows:
            project_data = normalize_project(project)
            project_data['teamMembers'] = team_members_by_project.get(project.get('id'), [])
            project_data['uploadedFiles'] = strip_uploaded_files_for_list(project_data.get('uploadedFiles'))
            projects.append(project_data)
        return Response(projects, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_project(request, project_id):
    """Get project by ID"""
    try:
        response = execute_with_retry(supabase.table('projects').select('*').eq('id', project_id))
        if response.data:
            project = response.data[0]
            project_data = normalize_project(project)
            try:
                team_response = execute_with_retry(
                    supabase.table('team_members').select('*').eq('project_id', project_id)
                )
                project_data['teamMembers'] = team_response.data or []
            except Exception:
                project_data['teamMembers'] = []
            return Response(project_data, status=status.HTTP_200_OK)
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def download_project_zip(request, project_id):
    """Download project uploaded files as a ZIP archive."""
    try:
        user_id = request.GET.get('userId')
        response = execute_with_retry(supabase.table('projects').select('*').eq('id', project_id))
        if not response.data:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        project = normalize_project(response.data[0])
        has_access = (
            project.get('status') == 'public'
            or project.get('ownerId') == user_id
            or user_id in (project.get('approvedFacultyIds') or [])
        )

        if not has_access and user_id:
            is_member, _project_row, _user = is_project_teammate(project_id, user_id)
            has_access = is_member

        if not has_access:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        uploaded_files = normalize_uploaded_file_list(project.get('uploadedFiles'))
        archive_name = sanitize_archive_name(project.get('title'), 'project')
        zip_buffer = BytesIO()

        with ZipFile(zip_buffer, 'w', compression=ZIP_DEFLATED) as zip_file:
            if uploaded_files:
                for index, file in enumerate(uploaded_files, start=1):
                    if not isinstance(file, dict):
                        continue

                    file_name = sanitize_archive_file_name(file.get('name') or f'file_{index}', f'file_{index}')
                    file_path = (file.get('path') or '').strip().strip('/\\')
                    archive_path = f'{file_path}/{file_name}' if file_path else file_name
                    file_bytes = decode_uploaded_file_content(file.get('content'))
                    zip_file.writestr(archive_path, file_bytes)
            else:
                zip_file.writestr(
                    'README.txt',
                    f'No uploaded files were available for {project.get("title", "this project")}.',
                )

        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{archive_name}-repository.zip"'
        return response
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def create_project(request):
    """Create a new project"""
    try:
        owner_id = request.data.get('ownerId') or request.data.get('ownerid')
        owner_name = request.data.get('owner')
        owner_user = fetch_user_basic(owner_id) if owner_id else None

        project_data = {
            'id': str(uuid.uuid4()),
            'title': request.data.get('title'),
            'abstract': request.data.get('abstract'),
            'domains': request.data.get('domains', []),
            'year': request.data.get('year'),
            'license': request.data.get('license'),
            'techstack': request.data.get('techStack', []),
            'status': request.data.get('status', 'public'),
            'owner': owner_name,
            'ownerid': owner_id,
            'uploadedfiles': request.data.get('uploadedFiles', []),
            'createdat': datetime.utcnow().isoformat(),
            'lastupdated': datetime.utcnow().isoformat(),
            'approvedfacultyids': request.data.get('approvedFacultyIds', []),
            'approvalstatus': request.data.get('approvalStatus', 'pending')
        }

        team_members = request.data.get('teamMembers', [])
        verified_team_members = []

        for index, member in enumerate(team_members):
            member_email = normalize_identifier(member.get('email'))
            member_name = member.get('name', '').strip()
            contribution = member.get('contribution', '').strip()

            if not member_email or not contribution:
                return Response({'error': 'Each team member must include an email and contribution'}, status=status.HTTP_400_BAD_REQUEST)

            matched_user = fetch_user_by_identity(member_email) or fetch_user_by_identity(member_name)

            if index == 0:
                if owner_user is None:
                    return Response({'error': 'Project owner must be a registered user'}, status=status.HTTP_400_BAD_REQUEST)

                verified_team_members.append({
                    'name': owner_user.get('name') or member_name or owner_name,
                    'email': owner_user.get('email') or owner_user.get('username') or member_email,
                    'contribution': contribution or 'Project Lead',
                })
                continue

            if matched_user is None:
                return Response(
                    {'error': f'Team member with email "{member.get("email")}" is not a registered user'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            verified_team_members.append({
                'name': matched_user.get('name') or member_name,
                'email': matched_user.get('email') or matched_user.get('username') or member_email,
                'contribution': contribution,
            })

        insert_response = supabase.table('projects').insert(project_data).execute()

        # Insert team members
        for member in verified_team_members:
            member_data = {
                'id': str(uuid.uuid4()),
                'project_id': project_data['id'],
                'name': member.get('name'),
                'email': member.get('email'),
                'contribution': member.get('contribution')
            }
            supabase.table('team_members').insert(member_data).execute()

        # Use saved row if available to reflect DB values
        saved_project = insert_response.data[0] if insert_response and getattr(insert_response, 'data', None) else project_data

        created_project = normalize_project(saved_project)
        created_project['teamMembers'] = verified_team_members
        created_project['uploadedFiles'] = project_data.get('uploadedfiles', [])

        recipient_ids = collect_project_notification_recipients(
            created_project,
            verified_team_members,
            exclude_user_id=owner_id,
        )
        for recipient_id in recipient_ids:
            create_notification(
                recipient_id,
                'Added to a project',
                f'You were added to "{created_project.get("title", "Untitled Project")}" by {owner_name or "the team lead"}.',
                'project_created',
                project_data['id']
            )

        return Response(created_project, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def update_project(request, project_id):
    """Update a project"""
    try:
        existing_response = supabase.table('projects').select('*').eq('id', project_id).execute()
        if not existing_response.data:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        existing_project = existing_response.data[0]
        existing_normalized = normalize_project(existing_project)
        existing_uploaded_files = normalize_uploaded_file_list(
            existing_project.get('uploadedfiles') or existing_project.get('uploadedFiles') or []
        )
        existing_readme_content = extract_project_readme_content(existing_project)
        requested_uploaded_files = request.data.get('uploadedFiles')
        if requested_uploaded_files is None:
            requested_uploaded_files = request.data.get('uploadedfiles')

        file_operation = request.data.get('fileOperation')
        if requested_uploaded_files is not None and file_operation == 'append':
            resolved_uploaded_files = merge_uploaded_file_lists(existing_uploaded_files, requested_uploaded_files)
        else:
            resolved_uploaded_files = requested_uploaded_files

        has_readme_update = 'readmeContent' in request.data or 'readmecontent' in request.data
        next_readme_content = request.data.get('readmeContent')
        if next_readme_content is None and 'readmecontent' in request.data:
            next_readme_content = request.data.get('readmecontent')

        if has_readme_update:
            resolved_uploaded_files = upsert_project_readme_file(
                resolved_uploaded_files if resolved_uploaded_files is not None else existing_uploaded_files,
                next_readme_content or '',
                datetime.utcnow().isoformat(),
                request.data.get('actorId'),
                request.data.get('actorName'),
            )

        project_data = {
            'title': request.data.get('title'),
            'abstract': request.data.get('abstract'),
            'domains': request.data.get('domains'),
            'year': request.data.get('year'),
            'license': request.data.get('license'),
            'techstack': request.data.get('techStack') or request.data.get('techstack'),
            'uploadedfiles': resolved_uploaded_files,
            'status': request.data.get('status'),
            'lastupdated': datetime.utcnow().isoformat(),
            'approvalstatus': request.data.get('approvalStatus') or request.data.get('approvalstatus')
        }
        project_data = {k: v for k, v in project_data.items() if v is not None}

        response = supabase.table('projects').update(project_data).eq('id', project_id).execute()
        if response.data:
            updated = normalize_project(response.data[0])
            team_response = supabase.table('team_members').select('*').eq('project_id', project_id).execute()
            updated['teamMembers'] = team_response.data or []

            updated_uploaded_files = normalize_uploaded_file_list(updated.get('uploadedFiles') or [])
            visible_updated_files = [
                file for file in updated_uploaded_files
                if isinstance(file, dict) and file.get('id') != README_FILE_ID
            ]
            visible_existing_files = [
                file for file in existing_uploaded_files
                if isinstance(file, dict) and file.get('id') != README_FILE_ID
            ]
            existing_file_ids = get_uploaded_file_ids(existing_uploaded_files)
            updated_file_ids = get_uploaded_file_ids(updated_uploaded_files)
            new_files = [
                file for file in visible_updated_files
                if isinstance(file, dict) and file.get('id') not in existing_file_ids
            ]
            removed_files = [
                file for file in visible_existing_files
                if isinstance(file, dict) and file.get('id') not in updated_file_ids
            ]
            readme_changed = has_readme_update and (next_readme_content or '') != existing_readme_content

            actor_id = request.data.get('actorId')
            actor_name = request.data.get('actorName') or 'A team member'
            recipient_ids = collect_project_notification_recipients(
                updated,
                updated.get('teamMembers') or [],
                exclude_user_id=actor_id,
            )
            print(f'Project update notification recipients for {project_id}: {sorted(recipient_ids)} (actor: {actor_id})')

            if new_files:
                file_names = ', '.join(file.get('name', 'new file') for file in new_files[:3])
                if len(new_files) > 3:
                    file_names = f'{file_names} and {len(new_files) - 3} more'

                for recipient_id in recipient_ids:
                    create_notification(
                        recipient_id,
                        'New files added',
                        f'{actor_name} added {file_names} to "{updated.get("title", "Untitled Project")}".',
                        'project_files',
                        project_id
                    )
            elif removed_files:
                file_names = ', '.join(file.get('name', 'a file') for file in removed_files[:3])
                if len(removed_files) > 3:
                    file_names = f'{file_names} and {len(removed_files) - 3} more'

                for recipient_id in recipient_ids:
                    create_notification(
                        recipient_id,
                        'Files removed',
                        f'{actor_name} removed {file_names} from "{updated.get("title", "Untitled Project")}".',
                        'project_files_removed',
                        project_id
                    )
            elif readme_changed:
                for recipient_id in recipient_ids:
                    create_notification(
                        recipient_id,
                        'README updated',
                        f'{actor_name} updated the README in "{updated.get("title", "Untitled Project")}".',
                        'project_readme_updated',
                        project_id
                    )
            elif actor_id:
                fields_to_compare = ['title', 'abstract', 'domains', 'year', 'license', 'techStack', 'status']
                has_project_changes = any(existing_normalized.get(field) != updated.get(field) for field in fields_to_compare)
                if has_project_changes:
                    for recipient_id in recipient_ids:
                        create_notification(
                            recipient_id,
                            'Project updated',
                            f'{actor_name} made changes to "{updated.get("title", "Untitled Project")}".',
                            'project_updated',
                            project_id
                        )

            return Response(updated, status=status.HTTP_200_OK)
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_project(request, project_id):
    """Delete a project"""
    try:
        project_response = supabase.table('projects').select('*').eq('id', project_id).execute()
        if not project_response.data:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        project = normalize_project(project_response.data[0])
        actor_id = request.data.get('actorId')
        actor_role = request.data.get('actorRole')
        if not actor_id:
            return Response({'error': 'Missing actor information'}, status=status.HTTP_400_BAD_REQUEST)
        if actor_role != 'admin' and actor_id != project.get('ownerId'):
            return Response({'error': 'Only the team leader can delete this project'}, status=status.HTTP_403_FORBIDDEN)

        team_response = supabase.table('team_members').select('*').eq('project_id', project_id).execute()

        recipient_ids = collect_project_notification_recipients(
            project,
            team_response.data or [],
            exclude_user_id=None,
        )
        print(f'Project delete notification recipients for {project_id}: {sorted(recipient_ids)}')

        for recipient_id in recipient_ids:
            create_notification(
                recipient_id,
                'Project deleted',
                f'The project "{project.get("title", "Untitled Project")}" was deleted by an admin.',
                'project_deleted',
                project_id
            )

        # Delete team members first
        supabase.table('team_members').delete().eq('project_id', project_id).execute()
        supabase.table('access_requests').delete().eq('project_id', project_id).execute()

        # Delete project
        supabase.table('projects').delete().eq('id', project_id).execute()
        return Response({'message': 'Project deleted'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_projects_by_owner(request, owner_id):
    """Get projects by owner"""
    try:
        response = execute_with_retry(supabase.table('projects').select(PROJECT_LIST_SELECT).eq('ownerid', owner_id))
        project_rows = response.data or []
        team_members_by_project = fetch_team_members_grouped([project.get('id') for project in project_rows if project.get('id')])
        projects = []
        for project in project_rows:
            project_data = normalize_project(project)
            project_data['teamMembers'] = team_members_by_project.get(project.get('id'), [])
            project_data['uploadedFiles'] = strip_uploaded_files_for_list(project_data.get('uploadedFiles'))
            projects.append(project_data)
        return Response(projects, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ========================
# ACCESS REQUESTS ENDPOINTS
# ========================

@api_view(['GET'])
def get_access_requests(request):
    """Get all access requests"""
    try:
        response = supabase.table('access_requests').select('*').execute()
        # Transform snake_case to camelCase for consistency
        transformed = []
        for req in response.data:
            transformed.append({
                'id': req.get('id'),
                'projectId': req.get('project_id'),
                'facultyId': req.get('faculty_id'),
                'facultyName': req.get('faculty_name'),
                'status': req.get('status'),
                'timestamp': req.get('timestamp')
            })
        return Response(transformed, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_access_requests_for_project(request, project_id):
    """Get access requests for a project"""
    try:
        response = supabase.table('access_requests').select('*').eq('project_id', project_id).execute()
        # Transform snake_case to camelCase for consistency
        transformed = []
        for req in response.data:
            transformed.append({
                'id': req.get('id'),
                'projectId': req.get('project_id'),
                'facultyId': req.get('faculty_id'),
                'facultyName': req.get('faculty_name'),
                'status': req.get('status'),
                'timestamp': req.get('timestamp')
            })
        return Response(transformed, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def create_access_request(request):
    """Create an access request"""
    try:
        project_id = request.data.get('projectId')
        faculty_id = request.data.get('facultyId')
        faculty_name = request.data.get('facultyName')
        
        if not all([project_id, faculty_id, faculty_name]):
            return Response(
                {'error': 'Missing required fields: projectId, facultyId, facultyName'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_response = (
            supabase.table('access_requests')
            .select('*')
            .eq('project_id', project_id)
            .eq('faculty_id', faculty_id)
            .order('timestamp', desc=True)
            .execute()
        )
        existing_requests = existing_response.data or []
        latest_request = existing_requests[0] if existing_requests else None

        if latest_request and latest_request.get('status') == 'pending':
            return Response(
                {'error': 'An access request is already pending for this project.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if latest_request and latest_request.get('status') == 'approved':
            return Response(
                {'error': 'Access has already been granted for this project.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if latest_request and latest_request.get('status') == 'rejected':
            refreshed_request = {
                'faculty_name': faculty_name,
                'status': 'pending',
                'timestamp': datetime.utcnow().isoformat(),
            }
            supabase.table('access_requests').update(refreshed_request).eq('id', latest_request['id']).execute()
            return Response({
                'id': latest_request['id'],
                'projectId': project_id,
                'facultyId': faculty_id,
                'facultyName': faculty_name,
                'status': 'pending',
                'timestamp': refreshed_request['timestamp']
            }, status=status.HTTP_200_OK)
        
        access_request = {
            'id': str(uuid.uuid4()),
            'project_id': project_id,
            'faculty_id': faculty_id,
            'faculty_name': faculty_name,
            'status': 'pending',
            'timestamp': datetime.utcnow().isoformat()
        }
        
        print(f'Inserting access request: {access_request}')
        response = supabase.table('access_requests').insert(access_request).execute()
        print(f'Supabase response: {response}')
        
        # Return in format frontend expects
        return Response({
            'id': access_request['id'],
            'projectId': access_request['project_id'],
            'facultyId': access_request['faculty_id'],
            'facultyName': access_request['faculty_name'],
            'status': access_request['status'],
            'timestamp': access_request['timestamp']
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        print(f'Error creating access request: {str(e)}')
        import traceback
        traceback.print_exc()
        return Response({'error': f'Failed to create access request: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def approve_access_request(request, request_id):
    """Approve an access request"""
    try:
        print(f'Approving access request: {request_id}')
        
        # Update request status
        supabase.table('access_requests').update({'status': 'approved'}).eq('id', request_id).execute()
        print(f'Updated request status to approved')
        
        # Get request details
        req_response = supabase.table('access_requests').select('*').eq('id', request_id).execute()
        if req_response.data:
            req = req_response.data[0]
            print(f'Request details: {req}')
            
            # Add faculty to approved list in projects table
            proj_id = req.get('project_id')
            faculty_id = req.get('faculty_id')
            faculty_name = req.get('faculty_name') or 'A user'
            print(f'Adding faculty {faculty_id} to project {proj_id} approvedFacultyIds')
            
            # Get current approved faculty IDs
            proj_response = supabase.table('projects').select('*').eq('id', proj_id).execute()
            if proj_response.data:
                project = proj_response.data[0]
                approved_ids = project.get('approvedfacultyids', [])
                if not isinstance(approved_ids, list):
                    approved_ids = []
                
                print(f'Current approvedfacultyids: {approved_ids}')
                
                if faculty_id not in approved_ids:
                    approved_ids.append(faculty_id)
                    supabase.table('projects').update({'approvedfacultyids': approved_ids}).eq('id', proj_id).execute()
                    print(f'Updated approvedfacultyids to: {approved_ids}')

                normalized_project = normalize_project(project)
                team_response = supabase.table('team_members').select('*').eq('project_id', proj_id).execute()
                recipient_ids = collect_project_notification_recipients(
                    normalized_project,
                    team_response.data or [],
                    exclude_user_id=faculty_id,
                )

                for recipient_id in recipient_ids:
                    create_notification(
                        recipient_id,
                        'Project access granted',
                        f'{faculty_name} was granted access to "{normalized_project.get("title", "Untitled Project")}".',
                        'access_request_approved',
                        proj_id,
                    )

                create_notification(
                    faculty_id,
                    'Access request approved',
                    f'You can now access "{normalized_project.get("title", "Untitled Project")}".',
                    'access_request_approved',
                    proj_id,
                )
        
        return Response({'message': 'Request approved'}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f'Error approving request: {str(e)}')
        import traceback
        traceback.print_exc()
        return Response({'error': f'Failed to approve request: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def reject_access_request(request, request_id):
    """Reject an access request"""
    try:
        print(f'Rejecting access request: {request_id}')
        supabase.table('access_requests').update({'status': 'rejected'}).eq('id', request_id).execute()
        print(f'Updated request status to rejected')

        req_response = supabase.table('access_requests').select('*').eq('id', request_id).execute()
        if req_response.data:
            req = req_response.data[0]
            project_id = req.get('project_id')
            faculty_id = req.get('faculty_id')
            faculty_name = req.get('faculty_name') or 'A user'

            project_response = supabase.table('projects').select('*').eq('id', project_id).execute()
            if project_response.data:
                normalized_project = normalize_project(project_response.data[0])
                project_title = normalized_project.get('title', 'Untitled Project')

                team_response = supabase.table('team_members').select('*').eq('project_id', project_id).execute()
                recipient_ids = collect_project_notification_recipients(
                    normalized_project,
                    team_response.data or [],
                    exclude_user_id=faculty_id,
                )

                for recipient_id in recipient_ids:
                    create_notification(
                        recipient_id,
                        'Access request rejected',
                        f'{faculty_name} was not granted access to "{project_title}".',
                        'access_request_rejected',
                        project_id,
                    )

                create_notification(
                    faculty_id,
                    'Access request rejected',
                    f'Your access request for "{project_title}" was rejected.',
                    'access_request_rejected',
                    project_id,
                )

        return Response({'message': 'Request rejected'}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f'Error rejecting request: {str(e)}')
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ========================
# LANDING CONTENT ENDPOINTS
# ========================

@api_view(['GET'])
def get_landing_content(request):
    """Get landing page content"""
    try:
        existing_row = get_existing_landing_content_row()
        if existing_row:
            return Response(normalize_landing_content(existing_row), status=status.HTTP_200_OK)
        return Response({'error': 'Content not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def update_landing_content(request):
    """Update landing page content (admin only)"""
    try:
        existing_row = get_existing_landing_content_row()

        modern_payload = build_modern_landing_content_payload(request.data)
        fallback_payload = build_legacy_landing_content_payload(request.data)

        try:
            response = execute_landing_content_write(existing_row, modern_payload, drop_missing_columns=False)
        except Exception as modern_error:
            print(f'Falling back to legacy landing_content schema: {modern_error}')
            response = execute_landing_content_write(existing_row, fallback_payload, drop_missing_columns=True)

        if getattr(response, 'data', None):
            saved_record = response.data[0]
        else:
            refresh_row = get_existing_landing_content_row()
            if refresh_row:
                saved_record = refresh_row
            elif existing_row:
                saved_record = {**existing_row, **fallback_payload, **modern_payload}
            else:
                saved_record = {'id': LANDING_CONTENT_SINGLETON_ID, **fallback_payload, **modern_payload}

        return Response(normalize_landing_content(saved_record), status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_notifications(request, user_id):
    """Get notifications for a user."""
    global NOTIFICATIONS_TABLE_AVAILABLE
    if not NOTIFICATIONS_TABLE_AVAILABLE:
        return Response([], status=status.HTTP_200_OK)

    try:
        response = supabase.table('notifications').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        notifications = []
        for item in response.data:
            notifications.append({
                'id': item.get('id'),
                'userId': item.get('user_id'),
                'title': item.get('title'),
                'message': item.get('message'),
                'type': item.get('type', 'general'),
                'projectId': item.get('project_id'),
                'isRead': item.get('is_read', False),
                'createdAt': item.get('created_at'),
            })
        return Response(notifications, status=status.HTTP_200_OK)
    except Exception as e:
        if 'public.notifications' in str(e):
            NOTIFICATIONS_TABLE_AVAILABLE = False
        print(f'Notification fetch failed for user {user_id}: {e}')
        return Response([], status=status.HTTP_200_OK)


@api_view(['PUT'])
def mark_notification_read(request, notification_id):
    """Mark a notification as read."""
    global NOTIFICATIONS_TABLE_AVAILABLE
    if not NOTIFICATIONS_TABLE_AVAILABLE:
        return Response({'message': 'Notification service unavailable'}, status=status.HTTP_200_OK)

    try:
        supabase.table('notifications').update({'is_read': True}).eq('id', notification_id).execute()
        return Response({'message': 'Notification marked as read'}, status=status.HTTP_200_OK)
    except Exception as e:
        if 'public.notifications' in str(e):
            NOTIFICATIONS_TABLE_AVAILABLE = False
        print(f'Notification mark-read failed for {notification_id}: {e}')
        return Response({'message': 'Notification service unavailable'}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
def delete_notification(request, notification_id):
    """Delete a single notification."""
    global NOTIFICATIONS_TABLE_AVAILABLE
    if not NOTIFICATIONS_TABLE_AVAILABLE:
        return Response({'message': 'Notification service unavailable'}, status=status.HTTP_200_OK)

    try:
        supabase.table('notifications').delete().eq('id', notification_id).execute()
        return Response({'message': 'Notification deleted'}, status=status.HTTP_200_OK)
    except Exception as e:
        if 'public.notifications' in str(e):
            NOTIFICATIONS_TABLE_AVAILABLE = False
        print(f'Notification delete failed for {notification_id}: {e}')
        return Response({'message': 'Notification service unavailable'}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
def clear_notifications(request, user_id):
    """Delete all notifications for a user."""
    global NOTIFICATIONS_TABLE_AVAILABLE
    if not NOTIFICATIONS_TABLE_AVAILABLE:
        return Response({'message': 'Notification service unavailable'}, status=status.HTTP_200_OK)

    try:
        supabase.table('notifications').delete().eq('user_id', user_id).execute()
        return Response({'message': 'Notifications cleared'}, status=status.HTTP_200_OK)
    except Exception as e:
        if 'public.notifications' in str(e):
            NOTIFICATIONS_TABLE_AVAILABLE = False
        print(f'Notification clear-all failed for user {user_id}: {e}')
        return Response({'message': 'Notification service unavailable'}, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_project_messages(request, project_id):
    """Get team-only chat messages for a project."""
    global PROJECT_MESSAGES_TABLE_AVAILABLE
    if not PROJECT_MESSAGES_TABLE_AVAILABLE:
        return Response([], status=status.HTTP_200_OK)

    user_id = request.GET.get('userId')
    is_member, project, _user = is_project_teammate(project_id, user_id)
    if not project:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    if not is_member:
        return Response({'error': 'Only project teammates can view chat'}, status=status.HTTP_403_FORBIDDEN)

    try:
        response = (
            supabase.table('project_messages')
            .select('*')
            .eq('project_id', project_id)
            .order('created_at', desc=False)
            .execute()
        )
        messages = [normalize_project_message(message) for message in (response.data or [])]
        return Response(messages, status=status.HTTP_200_OK)
    except Exception as exc:
        if 'public.project_messages' in str(exc):
            PROJECT_MESSAGES_TABLE_AVAILABLE = False
        return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def create_project_message(request, project_id):
    """Create a team-only chat message for a project."""
    global PROJECT_MESSAGES_TABLE_AVAILABLE
    if not PROJECT_MESSAGES_TABLE_AVAILABLE:
        return Response({'error': 'Project chat service unavailable'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    user_id = request.data.get('userId') or request.data.get('senderId')
    text = (request.data.get('message') or '').strip()

    if not user_id:
        return Response({'error': 'Missing userId'}, status=status.HTTP_400_BAD_REQUEST)
    if not text:
        return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

    is_member, project, user = is_project_teammate(project_id, user_id)
    if not project:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    if not is_member:
        return Response({'error': 'Only project teammates can send messages'}, status=status.HTTP_403_FORBIDDEN)
    if not user:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        message_data = {
            'id': str(uuid.uuid4()),
            'project_id': project_id,
            'sender_id': user.get('id'),
            'sender_name': user.get('name') or user.get('username') or 'Unknown User',
            'sender_email': user.get('email') or user.get('username') or '',
            'sender_role': user.get('role') or 'student',
            'message': text,
            'created_at': datetime.utcnow().isoformat(),
        }
        response = supabase.table('project_messages').insert(message_data).execute()
        saved_message = response.data[0] if getattr(response, 'data', None) else message_data

        try:
            team_response = execute_with_retry(
                supabase.table('team_members').select('*').eq('project_id', project_id)
            )
            project_for_notifications = normalize_project(project)
            recipient_ids = collect_project_notification_recipients(
                project_for_notifications,
                team_response.data or [],
                exclude_user_id=user.get('id'),
            )

            preview = text if len(text) <= 120 else f'{text[:117]}...'
            for recipient_id in recipient_ids:
                create_notification(
                    recipient_id,
                    f'New discussion message in {project_for_notifications.get("title", "your project")}',
                    f'{message_data["sender_name"]}: {preview}',
                    'project_message',
                    project_id
                )
        except Exception as notification_exc:
            print(f'Project message notifications failed for {project_id}: {notification_exc}')

        return Response(normalize_project_message(saved_message), status=status.HTTP_201_CREATED)
    except Exception as exc:
        if 'public.project_messages' in str(exc):
            PROJECT_MESSAGES_TABLE_AVAILABLE = False
        return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
