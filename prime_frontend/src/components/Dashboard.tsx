import { useState } from 'react';
import { Search, Plus, Filter, Lock, CheckCircle, Globe } from 'lucide-react';
import { User, Project, AccessRequest, ViewType, Notification, ProjectDetailTab } from '../App';
import { Sidebar } from './Sidebar';
import { NotificationPanel } from './NotificationPanel';
import { hasProjectGrantedAccess, isProjectOwner, isProjectTeammate } from '../lib/projectAccess';

interface DashboardProps {
  user: User;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  accessRequests: AccessRequest[];
  onNavigate: (view: ViewType, projectId?: string, projectTab?: ProjectDetailTab) => void;
  onLogout: () => void;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  notifications: Notification[];
  onMarkNotificationRead: (notificationId: string) => void;
  isLoadingProjects?: boolean;
  projectLoadError?: string | null;
  onRefreshNotifications: () => void | Promise<void>;
  onDeleteNotification: (notificationId: string) => void | Promise<void>;
  onClearNotifications: () => void | Promise<void>;
}

export function Dashboard({
  user,
  projects,
  setProjects,
  accessRequests,
  onNavigate,
  onLogout,
  onApproveRequest,
  onRejectRequest,
  notifications,
  onMarkNotificationRead,
  isLoadingProjects = false,
  projectLoadError = null,
  onRefreshNotifications,
  onDeleteNotification,
  onClearNotifications,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [showNotifications, setShowNotifications] = useState(false);

  const normalizedProjects = projects.map(project => ({
    ...project,
    domains: Array.isArray(project.domains) ? project.domains : [],
    techStack: Array.isArray(project.techStack) ? project.techStack : [],
    teamMembers: Array.isArray(project.teamMembers) ? project.teamMembers : [],
  }));

  // Get pending requests for the current student
  const pendingRequests = accessRequests.filter(
    req => req.status === 'pending' && 
    normalizedProjects.find(p => p.id === req.projectId && p.ownerId === user.id)
  );
  const unreadNotifications = notifications.filter(
    (notification) => notification.userId === user.id && !notification.isRead
  );

  // Filter projects based on search and filters
  const filteredProjects = normalizedProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.techStack.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDomain = selectedDomain === 'All' || project.domains.includes(selectedDomain);
    const matchesYear = selectedYear === 'All' || project.year === selectedYear;
    
    return matchesSearch && matchesDomain && matchesYear;
  });

  const allDomains = ['All', ...new Set(normalizedProjects.flatMap(p => p.domains))];
  const allYears = ['All', ...new Set(normalizedProjects.map(p => p.year))];

  const getStatusBadge = (project: Project) => {
    const userCanAccessProject =
      isProjectOwner(project, user) ||
      isProjectTeammate(project, user) ||
      hasProjectGrantedAccess(project, user) ||
      project.status === 'public';

    switch (project.status) {
      case 'public':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            <Globe className="w-3 h-3" />
            Public
          </span>
        );
      case 'locked':
        return (
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
            userCanAccessProject
              ? 'bg-slate-100 text-slate-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            <Lock className="w-3 h-3" />
            {userCanAccessProject ? 'Private' : 'Access Locked'}
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
    }
  };

  const getRelationshipBadge = (project: Project) => {
    if (isProjectOwner(project, user)) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
          Owner
        </span>
      );
    }

    if (isProjectTeammate(project, user)) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
          Team Member
        </span>
      );
    }

    if (hasProjectGrantedAccess(project, user)) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
          Access Granted
        </span>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        user={user}
        currentView="dashboard"
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

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Project Explorer</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Discover and collaborate on academic projects
              </p>
            </div>
            {user.role === 'student' && (
              <button
                onClick={() => onNavigate('create-project')}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30"
              >
                <Plus className="w-5 h-5" />
                Create Project
              </button>
            )}
          </div>
        </header>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-4">
          <div className="flex gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, domain, or tech stack..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Domain Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 appearance-none"
              >
                {allDomains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 appearance-none"
              >
                {allYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Project Grid */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-8">
          {projectLoadError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center mb-6">
              <p className="text-red-700 text-sm font-medium">{projectLoadError}</p>
            </div>
          )}

          {isLoadingProjects && normalizedProjects.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500 font-medium">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Search className="w-12 h-12 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">No projects found</h3>
              <p className="text-slate-600 dark:text-slate-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => onNavigate('project-detail', project.id)}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg flex-1">{project.title}</h3>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(project)}
                        {getRelationshipBadge(project)}
                      </div>
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                      {project.abstract}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.domains.map(domain => (
                        <span
                          key={domain}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs rounded-md font-medium"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <span>{project.year}</span>
                      <span>{isProjectOwner(project, user) ? `${project.owner} (Owner)` : project.owner}</span>
                    </div>
                  </div>
                ))}
              </div>
          )}
        </div>
      </div>

      {/* Notifications Panel */}
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
