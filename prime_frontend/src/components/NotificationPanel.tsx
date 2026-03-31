import { X, Check, XCircle, Clock, Bell } from 'lucide-react';
import { User, AccessRequest, Project, Notification, ViewType, ProjectDetailTab } from '../App';

interface NotificationPanelProps {
  user: User;
  accessRequests: AccessRequest[];
  projects: Project[];
  notifications: Notification[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onMarkRead: (notificationId: string) => void;
  onDeleteNotification: (notificationId: string) => void | Promise<void>;
  onClearNotifications: () => void | Promise<void>;
  onNavigate: (view: ViewType, projectId?: string, projectTab?: ProjectDetailTab) => void;
  onClose: () => void;
}

export function NotificationPanel({
  user,
  accessRequests,
  projects,
  notifications,
  onApprove,
  onReject,
  onMarkRead,
  onDeleteNotification,
  onClearNotifications,
  onNavigate,
  onClose,
}: NotificationPanelProps) {
  const relevantRequests = accessRequests.filter((req) => {
    const project = projects.find((p) => p.id === req.projectId);
    return Boolean(project && project.ownerId === user.id && req.status === 'pending');
  });

  const userNotifications = notifications.filter(
    (notification) => notification.userId === user.id && !notification.isRead
  );
  const hasUserNotifications = userNotifications.length > 0;

  const getNotificationTargetTab = (notification: Notification): ProjectDetailTab | null => {
    switch (notification.type) {
      case 'project_message':
        return 'discussion';
      case 'project_files':
      case 'project_files_removed':
      case 'project_readme_updated':
        return 'repository';
      case 'access_request_approved':
      case 'access_request_rejected':
      case 'project_created':
      case 'project_updated':
        return 'overview';
      default:
        return notification.projectId ? 'overview' : null;
    }
  };

  const getNotificationProjectTarget = (notification: Notification) => {
    if (!notification.projectId) return null;
    if (notification.type === 'project_deleted') return null;

    const hasProject = projects.some((project) => project.id === notification.projectId);
    return hasProject ? notification.projectId : null;
  };

  const handleOpenNotification = (notification: Notification) => {
    const projectTarget = getNotificationProjectTarget(notification);
    if (!projectTarget) return;
    const targetTab = getNotificationTargetTab(notification) || 'overview';

    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    onClose();
    onNavigate('project-detail', projectTarget, targetTab);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      />

      <div className="fixed right-0 top-0 w-96 bg-white border-l border-slate-200 h-screen flex flex-col z-50 shadow-2xl transform transition-transform duration-300 ease-out">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
          <div className="flex items-center gap-2">
            {hasUserNotifications && (
              <button
                onClick={() => void onClearNotifications()}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Clear All
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {relevantRequests.length === 0 && userNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <Check className="w-8 h-8 text-slate-400" />
              </div>
              <p className="font-medium text-slate-800">All caught up!</p>
              <p className="text-sm text-slate-600 mt-1">No pending notifications</p>
            </div>
          ) : (
            <>
              {relevantRequests.map((request) => {
                const project = projects.find((p) => p.id === request.projectId);
                if (!project) return null;

                return (
                  <div
                    key={request.id}
                    className="bg-slate-50 rounded-lg p-4 border border-slate-200 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition"
                    onClick={() => {
                      onClose();
                      onNavigate('project-detail', project.id, 'overview');
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 mb-1">Access Request</p>
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">{request.facultyName}</span> requested access to{' '}
                          <span className="font-medium">{project.title}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(request.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onApprove(request.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onReject(request.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300 transition text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}

              {userNotifications.map((notification) => {
                const projectTarget = getNotificationProjectTarget(notification);
                return (
                <div
                  key={notification.id}
                  className={`rounded-lg p-4 border ${
                    notification.isRead ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'
                  } ${projectTarget ? 'cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition' : ''}`}
                  onClick={() => handleOpenNotification(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 mb-1">{notification.title}</p>
                      <p className="text-sm text-slate-600">{notification.message}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        void onDeleteNotification(notification.id);
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition flex-shrink-0"
                      aria-label="Delete notification"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                  {!notification.isRead && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onMarkRead(notification.id);
                      }}
                      className="mt-3 w-full bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              )})}
            </>
          )}
        </div>
      </div>
    </>
  );
}
