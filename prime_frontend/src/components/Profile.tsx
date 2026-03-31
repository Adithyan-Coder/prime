import { useState } from 'react';
import { ArrowLeft, FolderKanban, Award, TrendingUp, Calendar, Globe, Lock, CheckCircle } from 'lucide-react';
import { User, Project, ViewType, AccessRequest, Notification, ProjectDetailTab } from '../App';
import { Sidebar } from './Sidebar';
import { NotificationPanel } from './NotificationPanel';
import { hasProjectGrantedAccess, isProjectOwner, isProjectTeammate } from '../lib/projectAccess';

interface ProfileProps {
  user: User;
  projects: Project[];
  accessRequests: AccessRequest[];
  onNavigate: (view: ViewType, projectId?: string, projectTab?: ProjectDetailTab) => void;
  onLogout: () => void;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  notifications: Notification[];
  onMarkNotificationRead: (notificationId: string) => void;
  onRefreshNotifications: () => void | Promise<void>;
  onDeleteNotification: (notificationId: string) => void | Promise<void>;
  onClearNotifications: () => void | Promise<void>;
}

export function Profile({
  user,
  projects,
  accessRequests,
  onNavigate,
  onLogout,
  onApproveRequest,
  onRejectRequest,
  notifications,
  onMarkNotificationRead,
  onRefreshNotifications,
  onDeleteNotification,
  onClearNotifications,
}: ProfileProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  // Filter projects where user is involved
  const userProjects = projects.filter((project) => {
    if (isProjectOwner(project, user) || isProjectTeammate(project, user)) {
      return true;
    }

    if (user.role !== 'student') {
      return project.status === 'public' || hasProjectGrantedAccess(project, user);
    }

    return false;
  });

  // Pending requests (for notification badge)
  const pendingRequests = accessRequests.filter(
    req =>
      req.status === 'pending' &&
      projects.find(p => p.id === req.projectId && p.ownerId === user.id)
  );
  const unreadNotifications = notifications.filter(
    (notification) => notification.userId === user.id && !notification.isRead
  );

  // Stats calculation
  const totalProjects = userProjects.length;
  const domainCounts: { [key: string]: number } = {};

  userProjects.forEach(project => {
    project.domains.forEach(domain => {
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    });
  });

  const topDomain =
    Object.entries(domainCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

  const stats = [
    {
      label: 'Projects Completed',
      value: totalProjects,
      icon: FolderKanban,
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
    {
      label: 'Top Domain',
      value: topDomain,
      icon: TrendingUp,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      label: 'Total Collaborations',
      value: userProjects.filter(p => p.teamMembers.length > 1).length,
      icon: Award,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  const getVisibilityBadge = (project: Project) => {
    const userCanAccessProject =
      isProjectOwner(project, user) ||
      isProjectTeammate(project, user) ||
      hasProjectGrantedAccess(project, user) ||
      project.status === 'public';

    switch (project.status) {
      case 'public':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            <Globe className="w-3 h-3" />
            Public
          </span>
        );
      case 'locked':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
            userCanAccessProject
              ? 'bg-slate-100 text-slate-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            <Lock className="w-3 h-3" />
            {userCanAccessProject ? 'Private' : 'Locked'}
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
    }
  };

  const getRelationshipLabel = (project: Project) => {
    if (isProjectOwner(project, user)) return 'Owner';
    if (isProjectTeammate(project, user)) return 'Team Member';
    if (hasProjectGrantedAccess(project, user)) return 'Access Granted';
    if (project.status === 'public') return 'Public Access';
    return null;
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        user={user}
        currentView="profile"
        notificationCount={pendingRequests.length + unreadNotifications.length}
        onNavigate={(view) => {
          if (view === 'notifications') {
            void onRefreshNotifications();
            setShowNotifications(!showNotifications);
          } else {
            onNavigate(view);
          }
        }}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>

            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {user.name.charAt(0)}
                  </span>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-800 mb-2">
                    {user.name}
                  </h1>
                  <p className="text-slate-600 mb-1">{user.email}</p>
                  <div className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm capitalize">
                    {user.role}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          {user.role === 'student' && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                Contribution Metrics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl border border-slate-200 p-6"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}
                        >
                          <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                        </div>
                        <div>
                          <p className="text-slate-600 text-sm mb-1">
                            {stat.label}
                          </p>
                          <p className="text-2xl font-bold text-slate-800">
                            {stat.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Projects */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {user.role === 'student' ? 'My Projects' : 'Projects with Access'}
            </h2>

            {userProjects.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderKanban className="w-10 h-10 text-slate-400" />
                </div>

                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  No Projects Yet
                </h3>

                <p className="text-slate-600 mb-6">
                  {user.role === 'student'
                    ? 'Get started by creating your first project'
                    : 'Request access to projects to see them here'}
                </p>

                {user.role === 'student' && (
                  <button
                    onClick={() => onNavigate('create-project')}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
                  >
                    Create Project
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProjects.map(project => {
                  const userMember = project.teamMembers.find((m) =>
                    (m.email || '').trim().toLowerCase() === (user.email || user.username || '').trim().toLowerCase() ||
                    (m.name || '').trim().toLowerCase() === user.name.trim().toLowerCase()
                  );
                  const relationshipLabel = getRelationshipLabel(project);

                  return (
                    <div
                      key={project.id}
                      onClick={() =>
                        onNavigate('project-detail', project.id)
                      }
                      className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-300 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-slate-800 text-lg">
                          {project.title}
                        </h3>
                        {getVisibilityBadge(project)}
                      </div>

                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {project.abstract}
                      </p>

                      {relationshipLabel && (
                        <div className="mb-4">
                          <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                            {relationshipLabel}
                          </span>
                        </div>
                      )}

                      {userMember && !isProjectOwner(project, user) && (
                        <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                          <p className="text-xs font-medium text-indigo-700">
                            Your Contribution
                          </p>
                          <p className="text-sm text-indigo-900">
                            {userMember.contribution}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between text-sm text-slate-500 border-t pt-4">
                        <span>{project.year}</span>
                        <span>{project.teamMembers.length} members</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/*Notification Panel */}
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
