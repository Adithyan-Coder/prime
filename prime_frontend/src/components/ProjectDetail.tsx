import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Lock, Send, Clock, FileText, MessageSquare, Folder, Trash2 } from 'lucide-react';
import { User, Project, AccessRequest, ViewType, UploadedFile, Notification, ProjectDetailTab } from '../App';
import { Sidebar } from './Sidebar';
import { RepositoryView } from './RepositoryView';
import { NotificationPanel } from './NotificationPanel';
import { apiClient } from '../lib/apiClient';
import { isProjectOwner, isProjectTeammate } from '../lib/projectAccess';

interface ProjectDetailProps {
  user: User;
  project: Project;
  projects: Project[];
  accessRequests: AccessRequest[];
  onNavigate: (view: ViewType, projectId?: string, projectTab?: ProjectDetailTab) => void;
  initialTab?: ProjectDetailTab;
  onLogout: () => void;
  onRequestAccess: (projectId: string) => void;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onAddFiles: (projectId: string, files: UploadedFile[]) => void;
  onDeleteFile: (projectId: string, fileId: string) => void;
  onUpdateReadme: (projectId: string, readmeContent: string) => void | Promise<void>;
  onDeleteProject: (projectId: string) => void;
  notifications: Notification[];
  onMarkNotificationRead: (notificationId: string) => void;
  onRefreshNotifications: () => void | Promise<void>;
  isLoadingProject?: boolean;
  onDeleteNotification: (notificationId: string) => void | Promise<void>;
  onClearNotifications: () => void | Promise<void>;
}

type TabType = ProjectDetailTab;

interface ChatMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  senderRole?: string;
  message: string;
  createdAt: string;
}

export function ProjectDetail({
  user,
  project,
  projects,
  accessRequests,
  onNavigate,
  initialTab = 'overview',
  onLogout,
  onRequestAccess,
  onApproveRequest,
  onRejectRequest,
  onAddFiles,
  onDeleteFile,
  onUpdateReadme,
  onDeleteProject,
  notifications,
  onMarkNotificationRead,
  onRefreshNotifications,
  isLoadingProject = false,
  onDeleteNotification,
  onClearNotifications,
}: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [message, setMessage] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Check if user has access (owner, team member, or approved faculty)
  const isOwner = isProjectOwner(project, user);
  const isTeamMember = isProjectTeammate(project, user);
  const canViewDiscussion = isOwner || isTeamMember;
  
  const hasAccess = 
    isOwner || // Project owner
    isTeamMember || // Team member
    project.status === 'public' || // Public projects
    project.approvedFacultyIds?.includes(user.id); // Approved users (faculty or others)

  // Check if request is pending
  const hasPendingRequest = accessRequests.some(
    req => req.projectId === project.id && req.facultyId === user.id && req.status === 'pending'
  );

  // Calculate notification count - only for project owners
  const notificationCount = accessRequests.filter(req => {
    const proj = projects.find(p => p.id === req.projectId);
    if (!proj) return false;

    // Project owner receives requests for their projects
    return proj.ownerId === user.id && req.status === 'pending';
  }).length;
  const unreadNotifications = notifications.filter(
    (notification) => notification.userId === user.id && !notification.isRead
  ).length;

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: FileText },
    { id: 'repository' as TabType, label: 'Repository', icon: Folder },
    { id: 'timeline' as TabType, label: 'Timeline', icon: Clock },
    ...(canViewDiscussion ? [{ id: 'discussion' as TabType, label: 'Discussion', icon: MessageSquare }] : []),
  ];

  const mockFiles = [
    { name: 'src', type: 'folder', children: [
      { name: 'components', type: 'folder', children: [] },
      { name: 'utils', type: 'folder', children: [] },
      { name: 'App.tsx', type: 'file', children: [] },
      { name: 'index.tsx', type: 'file', children: [] },
    ]},
    { name: 'docs', type: 'folder', children: [
      { name: 'README.md', type: 'file', children: [] },
      { name: 'API_DOCUMENTATION.md', type: 'file', children: [] },
    ]},
    { name: 'reports', type: 'folder', children: [
      { name: 'Project_Report.pdf', type: 'file', children: [] },
      { name: 'Presentation.pptx', type: 'file', children: [] },
    ]},
    { name: 'package.json', type: 'file', children: [] },
  ];

  const formatChatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return 'Just now';
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const mockTimeline = useMemo(() => {
    const items: Array<{ date: string; message: string; author: string }> = [];
    const ownerLabel = project.owner || 'Project Owner';

    const normalizeTimestamp = (value?: string) => {
      if (!value) return '';
      const parsedDate = new Date(value);
      return Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toISOString();
    };

    const createdAt = normalizeTimestamp(project.createdAt);
    const lastUpdated = normalizeTimestamp(project.lastUpdated);

    if (createdAt) {
      items.push({
        date: formatChatTime(createdAt),
        message: 'Project created',
        author: ownerLabel,
      });
    }

    (project.uploadedFiles || []).forEach((file) => {
      const uploadedAt = normalizeTimestamp(file.uploadedAt) || lastUpdated || createdAt;
      if (!uploadedAt) return;

      items.push({
        date: formatChatTime(uploadedAt),
        message:
          file.id === '__project_readme__' || file.name === 'README.md'
            ? 'Updated README.md'
            : `Uploaded ${file.name}`,
        author: file.uploadedByName || ownerLabel,
      });
    });

    return items;
  }, [project]);

  const isOwnerMember = (member: Project['teamMembers'][number]) => {
    const memberName = (member.name || '').trim().toLowerCase();
    const memberEmail = (member.email || '').trim().toLowerCase();
    const ownerName = (project.owner || '').trim().toLowerCase();
    const ownerEmail = (isOwner ? (user.email || user.username || '') : '').trim().toLowerCase();

    if (memberName && ownerName && memberName === ownerName) {
      return true;
    }

    if (memberEmail && ownerEmail && memberEmail === ownerEmail) {
      return true;
    }

    return false;
  };

  const loadChatMessages = async (showSpinner = false) => {
    if (!canViewDiscussion) {
      setChatMessages([]);
      setChatError(null);
      return;
    }

    if (showSpinner) {
      setIsLoadingChat(true);
    }

    try {
      const result = await apiClient.getProjectMessages(project.id, user.id);
      if ((result as any)?.error) {
        throw new Error((result as any).error);
      }

      setChatMessages(Array.isArray(result) ? result : []);
      setChatError(null);
    } catch (error: any) {
      setChatError(error?.message || 'Failed to load team chat.');
    } finally {
      if (showSpinner) {
        setIsLoadingChat(false);
      }
    }
  };

  useEffect(() => {
    if (!canViewDiscussion && activeTab === 'discussion') {
      setActiveTab('overview');
    }
  }, [activeTab, canViewDiscussion]);

  useEffect(() => {
    if (initialTab === 'discussion' && !canViewDiscussion) {
      setActiveTab('overview');
      return;
    }

    setActiveTab(initialTab);
  }, [canViewDiscussion, initialTab, project.id]);

  useEffect(() => {
    if (!canViewDiscussion) return;

    void loadChatMessages(true);
    const intervalId = window.setInterval(() => {
      void loadChatMessages(false);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [project.id, user.id, canViewDiscussion]);

  const sortedChatMessages = useMemo(
    () =>
      [...chatMessages].sort(
        (first, second) =>
          new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
      ),
    [chatMessages]
  );

  const sendCurrentMessage = async () => {
    const trimmedMessage = message.trim();
    if (!canViewDiscussion || !trimmedMessage || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const result = await apiClient.createProjectMessage(project.id, {
        userId: user.id,
        message: trimmedMessage,
      });
      if ((result as any)?.error) {
        throw new Error((result as any).error);
      }

      setChatMessages((prevMessages) => {
        const nextMessage = result as ChatMessage;
        if (prevMessages.some((existingMessage) => existingMessage.id === nextMessage.id)) {
          return prevMessages;
        }
        return [...prevMessages, nextMessage];
      });
      setMessage('');
      setChatError(null);
      await loadChatMessages(false);
    } catch (error: any) {
      setChatError(error?.message || 'Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    void sendCurrentMessage();
  };

  return (
    <div className="h-screen">
      {/* <Sidebar
        user={user}
        currentView="dashboard"
        notificationCount={notificationCount + unreadNotifications}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onNotificationClick={() => {
          void onRefreshNotifications();
          setShowNotifications(!showNotifications);
        }}
      /> */}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">{project.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>by {project.owner}</span>
                <span>•</span>
                <span>{project.year}</span>
                <span>•</span>
                <span>{project.license} License</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isOwner && (
                <button
                  onClick={() => onDeleteProject(project.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition shadow-lg shadow-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </button>
              )}
              {user.role === 'faculty' && !hasAccess && (
                <button
                  onClick={() => !hasPendingRequest && onRequestAccess(project.id)}
                  disabled={hasPendingRequest}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition shadow-lg ${
                    hasPendingRequest
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  {hasPendingRequest ? 'Request Sent' : 'Request Access'}
                </button>
              )}
              {!isOwner && !isTeamMember && !hasAccess && (
                <button
                  onClick={() => !hasPendingRequest && onRequestAccess(project.id)}
                  disabled={hasPendingRequest}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition shadow-lg ${
                    hasPendingRequest
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  {hasPendingRequest ? 'Request Sent' : 'Request Access'}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-200 px-8">
          <div className="flex gap-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium transition ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {isLoadingProject && (
            <div className="px-8 pt-6">
              <p className="text-slate-500 text-sm font-medium text-center">Loading project details...</p>
            </div>
          )}
          {!hasAccess ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Access Required</h3>
                <p className="text-slate-600 mb-6">
                  This project is private. Request access from the project owner to view full details.
                </p>
                <div className="bg-white rounded-lg border border-slate-200 p-6 text-left">
                  <h4 className="font-semibold text-slate-800 mb-3">Limited Preview</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Title:</span> {project.title}</p>
                    <p><span className="font-medium">Domains:</span> {project.domains.join(', ')}</p>
                    <p><span className="font-medium">Year:</span> {project.year}</p>
                    <p className="text-slate-500 italic">Full abstract and project details are hidden</p>
                  </div>
                </div>
                {!isOwner && !isTeamMember && (
                  <div className="mt-6">
                    <button
                      onClick={() => !hasPendingRequest && onRequestAccess(project.id)}
                      disabled={hasPendingRequest}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition shadow-lg mx-auto ${
                        hasPendingRequest
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30'
                      }`}
                    >
                      <Lock className="w-5 h-5" />
                      {hasPendingRequest ? 'Request Sent' : 'Request Access'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8">
              {activeTab === 'overview' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Abstract */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Abstract</h3>
                    <p className="text-slate-700 leading-relaxed">{project.abstract}</p>
                  </div>

                  {/* Team Members */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Team Members</h3>
                    <div className="space-y-4">
                      {project.teamMembers.map((member, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-700 font-semibold text-lg">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-slate-800">{member.name}</h4>
                              {isOwnerMember(member) && (
                                <span className="inline-flex items-center px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                  Owner
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mb-1">{member.email}</p>
                            <p className="text-sm text-indigo-600 font-medium">{member.contribution}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tech Stack & Details */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Tech Stack</h3>
                      <div className="flex flex-wrap gap-2">
                        {project.techStack.map(tech => (
                          <span
                            key={tech}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Project Info</h3>
                      <div className="space-y-2 text-sm">
                        <p className="flex justify-between">
                          <span className="text-slate-600">License:</span>
                          <span className="font-medium text-slate-800">{project.license}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-600">Academic Year:</span>
                          <span className="font-medium text-slate-800">{project.year}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-600">Last Updated:</span>
                          <span className="font-medium text-slate-800">
                            {new Date(project.lastUpdated).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'repository' && (
                <div className="max-w-7xl mx-auto">
                  <RepositoryView 
                    projectId={project.id}
                    projectTitle={project.title} 
                    owner={project.owner}
                    userId={user.id}
                    userName={user.name}
                    uploadedFiles={project.uploadedFiles}
                    readmeContent={project.readmeContent}
                    isOwner={isOwner || isTeamMember}
                    onAddFiles={(files) => onAddFiles(project.id, files)}
                    onDeleteFile={(fileId) => onDeleteFile(project.id, fileId)}
                    onUpdateReadme={(readmeContent) => onUpdateReadme(project.id, readmeContent)}
                  />
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="max-w-3xl mx-auto">
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Project Timeline</h3>
                    <div className="space-y-4">
                      {mockTimeline.map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 pb-4 border-b border-slate-100 last:border-0">
                            <p className="font-medium text-slate-800 mb-1">{item.message}</p>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span>{item.author}</span>
                              <span>•</span>
                              <span>{item.date}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'discussion' && (
                <div className="max-w-3xl mx-auto">
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Discussion</h3>
                    <p className="text-sm text-slate-500 mb-6">
                      Team chat is visible only to the project owner and listed teammates.
                    </p>

                    {chatError && (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {chatError}
                      </div>
                    )}
                    
                    {/* Messages */}
                    <div className="space-y-4 mb-6">
                      {isLoadingChat ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                          Loading team chat...
                        </div>
                      ) : sortedChatMessages.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                          No messages yet. Start the conversation with your teammates.
                        </div>
                      ) : (
                        sortedChatMessages.map((msg) => {
                          const isCurrentUser = msg.senderId === user.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex gap-3 ${isCurrentUser ? 'justify-end' : ''}`}
                            >
                              {!isCurrentUser && (
                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-slate-600 font-semibold text-sm">
                                    {msg.senderName.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div className={`max-w-[80%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-slate-800 text-sm">
                                    {isCurrentUser ? 'You' : msg.senderName}
                                  </span>
                                  <span className="text-xs text-slate-500">{formatChatTime(msg.createdAt)}</span>
                                </div>
                                <p
                                  className={`text-sm rounded-lg p-3 ${
                                    isCurrentUser
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  {msg.message}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            void sendCurrentMessage();
                          }
                        }}
                        placeholder="Message your teammates..."
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        disabled={isSendingMessage}
                      />
                      <button
                        type="button"
                        onClick={() => void sendCurrentMessage()}
                        disabled={isSendingMessage || !message.trim()}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                      >
                        <Send className="w-5 h-5" />
                        {isSendingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <NotificationPanel
          user={user}
          accessRequests={accessRequests}
          projects={projects}
          notifications={notifications}
          onApprove={onApproveRequest}
          onReject={onRejectRequest}
          onMarkRead={onMarkNotificationRead}
          onDeleteNotification={onDeleteNotification}
          onClearNotifications={onClearNotifications}
          onNavigate={onNavigate}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}
