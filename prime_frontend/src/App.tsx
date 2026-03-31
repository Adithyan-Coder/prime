import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { ProjectCreation } from './components/ProjectCreation';
import { Profile } from './components/Profile';
import { Landing } from './components/Landing';
import { AdminDashboard } from './components/AdminDashboard';
import { Settings } from './components/Settings';
import { defaultLandingContent, LandingContent } from './data/landingContent';
import { apiClient } from './lib/apiClient';

export type UserRole = 'student' | 'faculty' | 'admin';

export interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: UserRole;
}

export type ProjectStatus = 'public' | 'locked' | 'approved';

export interface TeamMember {
  name: string;
  email: string;
  contribution: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  path?: string;
  content?: string;
  uploadedById?: string;
  uploadedByName?: string;
}

export interface Project {
  id: string;
  title: string;
  abstract: string;
  domains: string[];
  year: string;
  license: string;
  techStack: string[];
  status: ProjectStatus;
  owner: string;
  ownerId: string;
  teamMembers: TeamMember[];
  uploadedFiles?: UploadedFile[];
  readmeContent?: string;
  createdAt: string;
  lastUpdated: string;
  approvedFacultyIds?: string[]; // Track which faculty members have been granted access
  approvalStatus?: 'pending' | 'approved' | 'rejected'; // Admin approval status
}

export interface AccessRequest {
  id: string;
  projectId: string;
  facultyId: string;
  facultyName: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  projectId?: string;
  isRead: boolean;
  createdAt: string;
}

export type ViewType = 'dashboard' | 'project-detail' | 'create-project' | 'profile' | 'settings';
export type ProjectDetailTab = 'overview' | 'repository' | 'timeline' | 'discussion';

function App() {
  const USER_STORAGE_KEY = 'prime_academic_hub_current_user';
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [landingContent, setLandingContent] = useState<LandingContent>(defaultLandingContent);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectTab, setSelectedProjectTab] = useState<ProjectDetailTab>('overview');
  const [isLoadingSelectedProject, setIsLoadingSelectedProject] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        const parsedUser = JSON.parse(stored) as User;
        setCurrentUser(parsedUser);
      } catch (e) {
        console.warn('Failed to restore user from localStorage', e);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      setShowLogin(false);
      setCurrentView('dashboard');
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
    // Add user to users list if not already present
    if (!allUsers.find(u => u.username === user.username)) {
      setAllUsers([...allUsers, user]);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const result = await apiClient.updateUser(updatedUser.id, updatedUser);
      if (result.error) throw new Error(result.error);
      setCurrentUser(result);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  // Load landing content on mount
  useEffect(() => {
    const loadLandingContent = async () => {
      try {
        const content = await apiClient.getLandingContent();
        if (content && !content.error) {
          setLandingContent(normalizeLandingData(content));
        }
      } catch (error) {
        console.log('Using default landing content');
      }
    };
    loadLandingContent();
  }, []);

  // Load projects and access requests when user is logged in
  useEffect(() => {
    if (currentUser) {
      loadProjects();
      loadAccessRequests();
      loadAllUsers();
      loadNotifications(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const intervalId = window.setInterval(() => {
      loadProjects();
      if (currentUser.role === 'admin') {
        loadAllUsers();
      }
      loadNotifications(currentUser.id);
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [currentUser]);

  const normalizeProjectData = (project: any): Project => {
    const safeArray = (value: any): any[] => (Array.isArray(value) ? value : []);

    return {
      id: project.id || project.ID || `proj-${Date.now()}`,
      title: project.title || '',
      abstract: project.abstract || '',
      domains: safeArray(project.domains ?? []),
      year: project.year || '',
      license: project.license || '',
      techStack: safeArray(project.techStack ?? project.techstack),
      status: project.status || 'locked',
      owner: project.owner || '',
      ownerId: project.ownerId || project.ownerid || '',
      teamMembers: safeArray(project.teamMembers),
      uploadedFiles: safeArray(project.uploadedFiles ?? project.uploadedfiles),
      readmeContent: project.readmeContent || project.readmecontent || '',
      createdAt: project.createdAt || project.createdat || new Date().toISOString(),
      lastUpdated: project.lastUpdated || project.lastupdated || new Date().toISOString(),
      approvedFacultyIds: safeArray(project.approvedFacultyIds ?? project.approvedfacultyids),
      approvalStatus: project.approvalStatus || project.approvalstatus || 'pending',
    };
  };

  const normalizeUserData = (user: any): User => ({
    id: user.id || `user-${Date.now()}`,
    username: user.username || user.email || '',
    email: user.email || '',
    name: user.name || user.username || 'Unknown User',
    role: (user.role || 'student') as UserRole,
  });

  const normalizeLandingData = (content: any): LandingContent => ({
    hero: {
      badge: content?.hero?.badge || defaultLandingContent.hero.badge,
      title: content?.hero?.title || defaultLandingContent.hero.title,
      highlight: content?.hero?.highlight || defaultLandingContent.hero.highlight,
      description: content?.hero?.description || defaultLandingContent.hero.description,
    },
    stats: Array.isArray(content?.stats) ? content.stats : defaultLandingContent.stats,
    features: Array.isArray(content?.features) ? content.features : defaultLandingContent.features,
    howItWorks: Array.isArray(content?.howItWorks) ? content.howItWorks : defaultLandingContent.howItWorks,
    cta: {
      title: content?.cta?.title || defaultLandingContent.cta.title,
      description: content?.cta?.description || defaultLandingContent.cta.description,
    },
  });

  const normalizeNotificationData = (notification: any): Notification => ({
    id: notification.id || `notification-${Date.now()}`,
    userId: notification.userId || notification.user_id || '',
    title: notification.title || 'Notification',
    message: notification.message || '',
    type: notification.type || 'general',
    projectId: notification.projectId || notification.project_id || undefined,
    isRead: Boolean(notification.isRead ?? notification.is_read),
    createdAt: notification.createdAt || notification.created_at || new Date().toISOString(),
  });

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    setProjectLoadError(null);
    try {
      const data = await apiClient.getProjects();
      if (Array.isArray(data)) {
        setProjects(data.map(normalizeProjectData));
      } else if (data?.error) {
        setProjectLoadError(data.error);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjectLoadError('Failed to load projects from the backend.');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadProjectDetail = async (projectId: string) => {
    setIsLoadingSelectedProject(true);
    try {
      const data = await apiClient.getProject(projectId);
      if (data?.error) {
        throw new Error(data.error);
      }
      const normalizedProject = normalizeProjectData(data);
      setSelectedProject(normalizedProject);
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === projectId ? { ...project, ...normalizedProject } : project
        )
      );
    } catch (error) {
      console.error('Failed to load project detail:', error);
      const fallbackProject = projects.find((project) => project.id === projectId) || null;
      setSelectedProject(fallbackProject);
    } finally {
      setIsLoadingSelectedProject(false);
    }
  };

  const loadAccessRequests = async () => {
    try {
      const data = await apiClient.getAccessRequests();
      if (Array.isArray(data)) {
        setAccessRequests(data);
      }
    } catch (error) {
      console.error('Failed to load access requests:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const data = await apiClient.getAllUsers();
      if (Array.isArray(data)) {
        setAllUsers(data.map(normalizeUserData));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadNotifications = async (userId: string) => {
    try {
      const data = await apiClient.getNotifications(userId);
      if (Array.isArray(data)) {
        setNotifications(data.map(normalizeNotificationData));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleUpdateLandingContent = async (updatedContent: LandingContent) => {
    try {
      const result = await apiClient.updateLandingContent(updatedContent);
      if (result?.error) {
        throw new Error(result.error);
      }
      setLandingContent(normalizeLandingData(result));
    } catch (error) {
      console.error('Failed to update landing content:', error);
      alert('Failed to save landing page content. Please try again.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
    localStorage.removeItem(USER_STORAGE_KEY);
    setShowLogin(false);
  };

  const handleNavigate = (view: ViewType, projectId?: string, projectTab?: ProjectDetailTab) => {
    setCurrentView(view);
    if (projectId) {
      setSelectedProjectId(projectId);
      setSelectedProjectTab(projectTab || 'overview');
      if (view === 'project-detail') {
        void loadProjectDetail(projectId);
      }
    } else if (view !== 'project-detail') {
      setSelectedProject(null);
      setSelectedProjectTab('overview');
    }
  };

  const handleCreateProject = async (project: Project) => {
    try {
      const result = await apiClient.createProject(project);
      if (result.error) throw new Error(result.error);
      // Refresh from backend to avoid stale local / mock state
      await loadProjects();
      setCurrentView('dashboard');
    } catch (error: any) {
      console.error('Failed to create project:', error);
      alert(`Failed to create project: ${error.message || error}`);
    }
  };

  const handleRequestAccess = async (projectId: string) => {
    if (!currentUser) return;
    try {
      const result = await apiClient.createAccessRequest(projectId, currentUser.id, currentUser.name);
      if (result.error) throw new Error(result.error);
      setAccessRequests((prevRequests) => [...prevRequests, result]);
    } catch (error) {
      console.error('Failed to request access:', error);
    }
  };

  const handleAddFilesToProject = async (projectId: string, files: UploadedFile[]) => {
    if (!currentUser) return;

    try {
      const result = await apiClient.updateProject(projectId, {
        uploadedFiles: files,
        fileOperation: 'append',
        actorId: currentUser.id,
        actorName: currentUser.name,
      });
      if (result?.error) throw new Error(result.error);

      const normalizedProject = normalizeProjectData(result);

      setProjects((prevProjects) =>
        prevProjects.map((proj) => (proj.id === projectId ? normalizedProject : proj))
      );

      if (selectedProjectId === projectId) {
        setSelectedProject(normalizedProject);
      }

      await loadNotifications(currentUser.id);
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('Failed to upload files. Please try again.');
    }
  };

  const handleDeleteFileFromProject = async (projectId: string, fileId: string) => {
    if (!currentUser) return;

    const fetchedProject =
      selectedProjectId === projectId && selectedProject
        ? selectedProject
        : await apiClient.getProject(projectId);

    if (!fetchedProject || (fetchedProject as any)?.error) {
      alert('Failed to load project before deleting the file.');
      return;
    }

    const project =
      selectedProjectId === projectId && selectedProject
        ? selectedProject
        : normalizeProjectData(fetchedProject);

    const updatedFiles = (project.uploadedFiles || []).filter((file) => file.id !== fileId);
    const deletedFile = (project.uploadedFiles || []).find((file) => file.id === fileId);

    try {
      const result = await apiClient.updateProject(projectId, {
        uploadedFiles: updatedFiles,
        fileOperation: 'replace',
        actorId: currentUser.id,
        actorName: currentUser.name,
      });
      if (result?.error) throw new Error(result.error);

      const normalizedProject = normalizeProjectData(result);
      setProjects((prevProjects) =>
        prevProjects.map((proj) => (proj.id === projectId ? normalizedProject : proj))
      );

      if (selectedProjectId === projectId) {
        setSelectedProject(normalizedProject);
      }

      await loadNotifications(currentUser.id);
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert(`Failed to delete ${deletedFile?.name || 'the file'}. Please try again.`);
    }
  };

  const handleUpdateProjectReadme = async (projectId: string, readmeContent: string) => {
    if (!currentUser) return;

    const fetchedProject =
      selectedProjectId === projectId && selectedProject
        ? selectedProject
        : await apiClient.getProject(projectId);

    if (!fetchedProject || (fetchedProject as any)?.error) {
      alert('Failed to load project before saving README.');
      return;
    }

    const baseProject =
      selectedProjectId === projectId && selectedProject
        ? selectedProject
        : normalizeProjectData(fetchedProject);

    try {
      const result = await apiClient.updateProject(projectId, {
        readmeContent,
        actorId: currentUser.id,
        actorName: currentUser.name,
      });
      if ((result as any)?.error) {
        throw new Error((result as any).error);
      }

      const normalizedProject = normalizeProjectData(result);
      setProjects((prevProjects) =>
        prevProjects.map((project) => (project.id === projectId ? normalizedProject : project))
      );

      if (selectedProjectId === projectId) {
        setSelectedProject(normalizedProject);
      }

      await loadNotifications(currentUser.id);
    } catch (error) {
      console.error('Failed to update project README:', error);
      alert('Failed to save README. Please try again.');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const result = await apiClient.approveAccessRequest(requestId);
      if (result.error) throw new Error(result.error);
      
      setAccessRequests(prevRequests => {
        const request = prevRequests.find(req => req.id === requestId);
        if (request) {
          setProjects(prevProjects =>
            prevProjects.map(proj =>
              proj.id === request.projectId
                ? { 
                    ...proj, 
                    approvedFacultyIds: [...(proj.approvedFacultyIds || []), request.facultyId]
                  }
                : proj
            )
          );
        }
        return prevRequests.map(req =>
          req.id === requestId ? { ...req, status: 'approved' as const } : req
        );
      });
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Failed to approve request. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const result = await apiClient.rejectAccessRequest(requestId);
      if (result.error) throw new Error(result.error);
      setAccessRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId ? { ...req, status: 'rejected' as const } : req
        )
      );
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject request. Please try again.');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!currentUser) return;

    try {
      const result = await apiClient.deleteProject(projectId, {
        actorId: currentUser.id,
        actorRole: currentUser.role,
      });
      if (result?.error) throw new Error(result.error);

      setProjects((prevProjects) => prevProjects.filter((proj) => proj.id !== projectId));
      setAccessRequests((prevRequests) => prevRequests.filter((req) => req.projectId !== projectId));

      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        setSelectedProject(null);
        setCurrentView('dashboard');
      }

      if (currentUser) {
        await loadNotifications(currentUser.id);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleUpdateProjectStatus = async (projectId: string, status: ProjectStatus) => {
    if (!currentUser) return;

    const project = projects.find((proj) => proj.id === projectId);
    if (!project) return;

    try {
      const result = await apiClient.updateProject(projectId, {
        ...project,
        status,
        actorId: currentUser.id,
        actorName: currentUser.name,
      });
      if (result?.error) throw new Error(result.error);

      const normalizedProject = normalizeProjectData(result);
      setProjects((prevProjects) =>
        prevProjects.map((proj) => (proj.id === projectId ? normalizedProject : proj))
      );

      if (selectedProjectId === projectId) {
        setSelectedProject(normalizedProject);
      }

      await loadNotifications(currentUser.id);
    } catch (error) {
      console.error('Failed to update project status:', error);
      alert('Failed to update project status. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const result = await apiClient.deleteUser(userId);
      if (result?.error) throw new Error(result.error);

      setAllUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleDeleteCurrentAccount = async () => {
    if (!currentUser) return;

    const confirmed = window.confirm('Delete your account permanently? This will also remove projects you own.');
    if (!confirmed) return;

    try {
      const result = await apiClient.deleteUser(currentUser.id);
      if ((result as any)?.error) {
        throw new Error((result as any).error);
      }

      setAllUsers((prevUsers) => prevUsers.filter((user) => user.id !== currentUser.id));
      setProjects((prevProjects) => prevProjects.filter((project) => project.ownerId !== currentUser.id));
      setAccessRequests((prevRequests) => prevRequests.filter((request) => request.facultyId !== currentUser.id));
      setNotifications([]);
      setSelectedProject(null);
      setSelectedProjectId(null);
      setCurrentUser(null);
      setCurrentView('dashboard');
      localStorage.removeItem(USER_STORAGE_KEY);
      setShowLogin(false);
    } catch (error) {
      console.error('Failed to delete current user:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      const result = await apiClient.markNotificationRead(notificationId);
      if (result?.error) throw new Error(result.error);

      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const result = await apiClient.deleteNotification(notificationId);
      if (result?.error) throw new Error(result.error);

      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleClearNotifications = async () => {
    if (!currentUser) return;

    try {
      const result = await apiClient.clearNotifications(currentUser.id);
      if (result?.error) throw new Error(result.error);

      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.userId !== currentUser.id)
      );
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const refreshCurrentUserNotifications = async () => {
    if (!currentUser) return;
    await loadNotifications(currentUser.id);
  };

  if (!currentUser) {
    if (!showLogin) {
      return <Landing onGetStarted={() => setShowLogin(true)} content={landingContent} />;
    }
    return <Login onLogin={handleLogin} onBack={() => setShowLogin(false)} />;
  }

  // Admin view
  if (currentUser.role === 'admin') {
    return (
      <AdminDashboard
        user={currentUser}
        landingContent={landingContent}
        onUpdateContent={handleUpdateLandingContent}
        onLogout={handleLogout}
        projects={projects}
        users={allUsers}
        onDeleteProject={handleDeleteProject}
        onUpdateProjectStatus={handleUpdateProjectStatus}
        onDeleteUser={handleDeleteUser}
        isLoadingProjects={isLoadingProjects}
        projectLoadError={projectLoadError}
        onRefreshProjects={loadProjects}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {currentView === 'dashboard' && (
        <Dashboard
          user={currentUser}
          projects={projects}
          setProjects={setProjects}
      accessRequests={accessRequests}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          isLoadingProjects={isLoadingProjects}
          projectLoadError={projectLoadError}
          onRefreshNotifications={refreshCurrentUserNotifications}
          onDeleteNotification={handleDeleteNotification}
          onClearNotifications={handleClearNotifications}
        />
      )}
      
      {currentView === 'create-project' && (
        <ProjectCreation
          user={currentUser}
          projects={projects}
          accessRequests={accessRequests}
          onNavigate={handleNavigate}
          onCreateProject={handleCreateProject}
          onLogout={handleLogout}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onRefreshNotifications={refreshCurrentUserNotifications}
          onDeleteNotification={handleDeleteNotification}
          onClearNotifications={handleClearNotifications}
        />
      )}

      {currentView === 'project-detail' && selectedProject && (
        <ProjectDetail
          user={currentUser}
          project={selectedProject}
          projects={projects}
          accessRequests={accessRequests}
          onNavigate={handleNavigate}
          initialTab={selectedProjectTab}
          onLogout={handleLogout}
          onRequestAccess={handleRequestAccess}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          onAddFiles={handleAddFilesToProject}
          onDeleteFile={handleDeleteFileFromProject}
          onUpdateReadme={handleUpdateProjectReadme}
          onDeleteProject={handleDeleteProject}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onRefreshNotifications={refreshCurrentUserNotifications}
          isLoadingProject={isLoadingSelectedProject}
          onDeleteNotification={handleDeleteNotification}
          onClearNotifications={handleClearNotifications}
        />
      )}

      {currentView === 'profile' && (
        <Profile
          user={currentUser}
          projects={projects}
          accessRequests={accessRequests}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onRefreshNotifications={refreshCurrentUserNotifications}
          onDeleteNotification={handleDeleteNotification}
          onClearNotifications={handleClearNotifications}
        />
      )}

      {currentView === 'settings' && (
        <Settings
          user={currentUser}
          projects={projects}
          accessRequests={accessRequests}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          onUpdateUser={handleUpdateUser}
          onDeleteAccount={handleDeleteCurrentAccount}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onRefreshNotifications={refreshCurrentUserNotifications}
          onDeleteNotification={handleDeleteNotification}
          onClearNotifications={handleClearNotifications}
        />
      )}
    </div>
  );
}

export default App;
