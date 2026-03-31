const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const handleResponse = async (response: Response) => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    return {
      error: (data as any)?.error || (data as any)?.message || 'API request failed',
    };
  }

  return data;
};

const request = async (path: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...jsonHeaders,
        ...(options.headers || {}),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    return {error: (error && error.message) || 'Network error'};
  }
};

const requestBlob = async (path: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || 'API request failed' };
      }
      return {
        error: (data as any)?.error || (data as any)?.message || 'API request failed',
      };
    }

    return await response.blob();
  } catch (error: any) {
    return { error: (error && error.message) || 'Network error' };
  }
};

export const apiClient = {
  login: (username: string, password: string, role: string) =>
    request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({username, password, role}),
    }),

  register: (username: string, password: string, name: string, role: string) =>
    request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({username, password, name, role}),
    }),

  getAllUsers: () => request('/users/'),
  getUser: (userId: string) => request(`/users/${userId}/`),
  updateUser: (userId: string, payload: unknown) =>
    request(`/users/${userId}/update/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteUser: (userId: string) =>
    request(`/users/${userId}/delete/`, {method: 'DELETE'}),

  getProjects: () => request('/projects/'),
  getProject: (projectId: string) => request(`/projects/${projectId}/`),
  downloadProjectZip: (projectId: string, userId: string) =>
    requestBlob(`/projects/${projectId}/download-zip/?userId=${encodeURIComponent(userId)}`),
  getProjectMessages: (projectId: string, userId: string) =>
    request(`/projects/${projectId}/messages/?userId=${encodeURIComponent(userId)}`),
  createProject: (project: unknown) =>
    request('/projects/create/', {
      method: 'POST',
      body: JSON.stringify(project),
    }),
  createProjectMessage: (projectId: string, payload: unknown) =>
    request(`/projects/${projectId}/messages/create/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProject: (projectId: string, payload: unknown) =>
    request(`/projects/${projectId}/update/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteProject: (projectId: string, payload?: unknown) =>
    request(`/projects/${projectId}/delete/`, {
      method: 'DELETE',
      body: payload ? JSON.stringify(payload) : undefined,
    }),

  getAccessRequests: () => request('/access-requests/'),
  getAccessRequestsForProject: (projectId: string) =>
    request(`/access-requests/project/${projectId}/`),
  createAccessRequest: (projectId: string, facultyId: string, facultyName: string) =>
    request('/access-requests/create/', {
      method: 'POST',
      body: JSON.stringify({projectId, facultyId, facultyName}),
    }),
  approveAccessRequest: (requestId: string) =>
    request(`/access-requests/${requestId}/approve/`, {method: 'PUT'}),
  rejectAccessRequest: (requestId: string) =>
    request(`/access-requests/${requestId}/reject/`, {method: 'PUT'}),

  getLandingContent: () => request('/landing-content/'),
  updateLandingContent: (payload: unknown) =>
    request('/landing-content/update/', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getNotifications: (userId: string) => request(`/notifications/${userId}/`),
  markNotificationRead: (notificationId: string) =>
    request(`/notifications/${notificationId}/read/`, {method: 'PUT'}),
  deleteNotification: (notificationId: string) =>
    request(`/notifications/${notificationId}/delete/`, {method: 'DELETE'}),
  clearNotifications: (userId: string) =>
    request(`/notifications/user/${userId}/clear/`, {method: 'DELETE'}),
};
