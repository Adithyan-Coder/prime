import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { NotificationPanel } from './NotificationPanel';
import { User, ViewType, AccessRequest, Project, Notification, ProjectDetailTab } from '../App';
import { Bell, Lock, User as UserIcon, Mail, Shield } from 'lucide-react';

interface SettingsProps {
  user: User;
  projects: Project[];
  accessRequests: AccessRequest[];
  onNavigate: (view: ViewType, projectId?: string, projectTab?: ProjectDetailTab) => void;
  onLogout: () => void;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onUpdateUser: (user: User) => void;
  onDeleteAccount: () => void | Promise<void>;
  notifications: Notification[];
  onMarkNotificationRead: (notificationId: string) => void;
  onRefreshNotifications: () => void | Promise<void>;
  onDeleteNotification: (notificationId: string) => void | Promise<void>;
  onClearNotifications: () => void | Promise<void>;
}

export function Settings({
  user,
  projects,
  accessRequests,
  onNavigate,
  onLogout,
  onApproveRequest,
  onRejectRequest,
  onUpdateUser,
  onDeleteAccount,
  notifications,
  onMarkNotificationRead,
  onRefreshNotifications,
  onDeleteNotification,
  onClearNotifications,
}: SettingsProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [editedUser, setEditedUser] = useState<User>(user);

  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  // Pending requests for badge
  const pendingRequests = accessRequests.filter(
    req =>
      req.status === 'pending' &&
      projects.find(p => p.id === req.projectId && p.ownerId === user.id)
  );
  const unreadNotifications = notifications.filter(
    (notification) => notification.userId === user.id && !notification.isRead
  );

  const handleUpdateField = (field: keyof User, value: string) => {
    setEditedUser({ ...editedUser, [field]: value });
  };

  const handleSave = async () => {
    await onUpdateUser(editedUser);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        user={user}
        currentView="settings"
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
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
            <p className="text-slate-600 mt-1">
              Manage your account preferences and settings
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Account Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Account Information
                </h3>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={editedUser.name}
                  readOnly
                  className="w-full px-4 py-3 border rounded-lg bg-slate-50"
                />
                <input
                  type="email"
                  value={editedUser.email || ''}
                  onChange={(e) => handleUpdateField('email', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="your.email@example.com"
                />
                <input
                  type="text"
                  value={editedUser.role}
                  readOnly
                  className="w-full px-4 py-3 border rounded-lg bg-slate-50"
                />
                <button
                  onClick={handleSave}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
              </div>

              <p className="text-sm text-slate-600">
                Control how you receive notifications.
              </p>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">Security</h3>
              </div>

              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                Enable 2FA
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-xl border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-red-600 mb-4">
                Danger Zone
              </h3>

              <button
                onClick={() => void onDeleteAccount()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete Account
              </button>
            </div>

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
