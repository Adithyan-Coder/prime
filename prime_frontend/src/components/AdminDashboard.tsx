import { useEffect, useMemo, useState } from 'react';
import { Save, Edit2, LayoutDashboard, LogOut, User as UserIcon, Users, FolderKanban, Trash2, Clock, Globe, Lock } from 'lucide-react';
import { User, Project, ProjectStatus } from '../App';
import { LandingContent } from '../data/landingContent';

interface AdminDashboardProps {
  user: User;
  landingContent: LandingContent;
  onUpdateContent: (content: LandingContent) => void | Promise<void>;
  onLogout: () => void;
  projects: Project[];
  users: User[];
  onDeleteProject: (projectId: string) => void;
  onUpdateProjectStatus: (projectId: string, status: ProjectStatus) => void | Promise<void>;
  onDeleteUser: (userId: string) => void;
  isLoadingProjects?: boolean;
  projectLoadError?: string | null;
  onRefreshProjects?: () => void;
}

type AdminView = 'overview' | 'users' | 'projects' | 'landing';
type ProjectFilter = 'all' | 'locked' | 'public';

export function AdminDashboard({
  user,
  landingContent,
  onUpdateContent,
  onLogout,
  projects,
  users,
  onDeleteProject,
  onUpdateProjectStatus,
  onDeleteUser,
  isLoadingProjects = false,
  projectLoadError = null,
  onRefreshProjects,
}: AdminDashboardProps) {
  const [content, setContent] = useState<LandingContent>(landingContent);
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('all');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setContent(landingContent);
  }, [landingContent]);

  const handleUpdate = (section: keyof LandingContent, data: any) => {
    setContent({ ...content, [section]: data });
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onUpdateContent(content);
    setHasChanges(false);
  };

  const handleReset = () => {
    setContent(landingContent);
    setHasChanges(false);
  };

  const totalUsers = users?.length || 0;
  const totalProjects = projects?.length || 0;
  const lockedProjects = projects?.filter((p) => p.status === 'locked').length || 0;
  const publicProjects = projects?.filter((p) => p.status === 'public').length || 0;
  const studentsCount = users?.filter((u) => u.role === 'student').length || 0;
  const facultyCount = users?.filter((u) => u.role === 'faculty').length || 0;
  const filteredProjects = useMemo(() => {
    if (projectFilter === 'all') return projects;
    return projects.filter((project) => project.status === projectFilter);
  }, [projectFilter, projects]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">Admin Panel</h1>
              <p className="text-xs text-slate-500">Live Project Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveView('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeView === 'overview' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </button>

          <button
            onClick={() => setActiveView('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeView === 'users' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">All Members</span>
            {totalUsers > 0 && (
              <span className="ml-auto bg-purple-100 text-purple-700 text-xs font-bold rounded-full px-2 py-1">
                {totalUsers}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('projects')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeView === 'projects' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FolderKanban className="w-5 h-5" />
            <span className="font-medium">All Projects</span>
            {totalProjects > 0 && (
              <span className="ml-auto bg-purple-100 text-purple-700 text-xs font-bold rounded-full px-2 py-1">
                {totalProjects}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('landing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeView === 'landing' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Edit2 className="w-5 h-5" />
            <span className="font-medium">Landing Page</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {activeView === 'overview' && 'Dashboard Overview'}
                {activeView === 'users' && 'All Members'}
                {activeView === 'projects' && 'All Projects'}
                {activeView === 'landing' && 'Landing Page Editor'}
              </h2>
              <p className="text-slate-600 mt-1">
                {activeView === 'overview' && 'Monitor your users, projects, and platform activity'}
                {activeView === 'users' && 'View and manage all registered users'}
                {activeView === 'projects' && 'View live projects and delete records when needed'}
                {activeView === 'landing' && 'Customize the landing page content'}
              </p>
            </div>
            {activeView === 'landing' && (
              <div className="flex gap-3">
                {hasChanges && (
                  <button
                    onClick={handleReset}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition ${
                    hasChanges
                      ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/30'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeView === 'overview' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800 mb-1">{totalUsers}</p>
                  <p className="text-slate-600 text-sm">Total Users</p>
                  <div className="mt-3 flex gap-4 text-xs">
                    <span className="text-slate-600">Students: {studentsCount}</span>
                    <span className="text-slate-600">Faculty: {facultyCount}</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                    <FolderKanban className="w-6 h-6 text-indigo-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800 mb-1">{totalProjects}</p>
                  <p className="text-slate-600 text-sm">Total Projects</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800 mb-1">{lockedProjects}</p>
                  <p className="text-slate-600 text-sm">Locked Projects</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <FolderKanban className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800 mb-1">{publicProjects}</p>
                  <p className="text-slate-600 text-sm">Public Projects</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveView('users')}
                    className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition"
                  >
                    <Users className="w-6 h-6 text-purple-600" />
                    <div className="text-left">
                      <p className="font-medium text-slate-800">View Members</p>
                      <p className="text-xs text-slate-600">Manage users</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveView('projects')}
                    className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition"
                  >
                    <FolderKanban className="w-6 h-6 text-purple-600" />
                    <div className="text-left">
                      <p className="font-medium text-slate-800">All Projects</p>
                      <p className="text-xs text-slate-600">{totalProjects} total</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveView('landing')}
                    className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition"
                  >
                    <Edit2 className="w-6 h-6 text-purple-600" />
                    <div className="text-left">
                      <p className="font-medium text-slate-800">Edit Landing</p>
                      <p className="text-xs text-slate-600">Customize content</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeView === 'users' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User ID</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {!users || users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            No users registered yet
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                  <UserIcon className="w-5 h-5 text-indigo-600" />
                                </div>
                                <span className="font-medium text-slate-800">{u.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{u.email}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                u.role === 'student'
                                  ? 'bg-blue-100 text-blue-700'
                                  : u.role === 'faculty'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-sm font-mono">{u.id}</td>
                            <td className="px-6 py-4 text-right">
                              {u.id !== user.id && (
                                <button
                                  onClick={() => onDeleteUser(u.id)}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === 'projects' && (
            <div className="max-w-7xl mx-auto space-y-6">
              {projectLoadError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-red-800">Couldn&apos;t load projects</p>
                    <p className="text-sm text-red-700">{projectLoadError}</p>
                  </div>
                  {onRefreshProjects && (
                    <button
                      onClick={onRefreshProjects}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => setProjectFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    projectFilter === 'all'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({totalProjects})
                </button>
                <button
                  onClick={() => setProjectFilter('locked')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    projectFilter === 'locked'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Locked ({lockedProjects})
                </button>
                <button
                  onClick={() => setProjectFilter('public')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    projectFilter === 'public'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Public ({publicProjects})
                </button>
              </div>

              <div className="space-y-4">
                {isLoadingProjects && projects.length === 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <p className="text-slate-500 font-medium">Loading projects...</p>
                  </div>
                )}

                {!isLoadingProjects && projects.length === 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <FolderKanban className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No projects submitted yet</p>
                  </div>
                )}

                {!isLoadingProjects && projects.length > 0 && filteredProjects.length === 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <FolderKanban className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No {projectFilter} projects found</p>
                  </div>
                )}

                {filteredProjects.map((project) => (
                  <div key={project.id} className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800">{project.title}</h3>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            project.status === 'locked' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {project.status === 'locked' ? 'Locked' : 'Public'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm mb-3">{project.abstract}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {project.domains.map((domain) => (
                            <span key={domain} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium">
                              {domain}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>Owner: {project.owner}</span>
                          <span>&bull;</span>
                          <span>Year: {project.year}</span>
                          <span>&bull;</span>
                          <span>Team: {project.teamMembers.length + 1} members</span>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4 flex-wrap justify-end">
                        {project.status === 'locked' ? (
                          <button
                            onClick={() => onUpdateProjectStatus(project.id, 'public')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                          >
                            <Globe className="w-4 h-4" />
                            Make Public
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateProjectStatus(project.id, 'locked')}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition"
                          >
                            <Lock className="w-4 h-4" />
                            Lock Project
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteProject(project.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'landing' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Hero Section</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Badge Text</label>
                  <input
                    type="text"
                    value={content.hero.badge}
                    onChange={(e) => handleUpdate('hero', { ...content.hero, badge: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={content.hero.title}
                    onChange={(e) => handleUpdate('hero', { ...content.hero, title: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Highlighted Text</label>
                  <input
                    type="text"
                    value={content.hero.highlight}
                    onChange={(e) => handleUpdate('hero', { ...content.hero, highlight: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={content.hero.description}
                    onChange={(e) => handleUpdate('hero', { ...content.hero, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-none"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Call-to-Action Section</h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">CTA Title</label>
                  <input
                    type="text"
                    value={content.cta.title}
                    onChange={(e) => handleUpdate('cta', { ...content.cta, title: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">CTA Description</label>
                  <textarea
                    value={content.cta.description}
                    onChange={(e) => handleUpdate('cta', { ...content.cta, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
