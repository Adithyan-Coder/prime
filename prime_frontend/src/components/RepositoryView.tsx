import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { 
  Code2, 
  GitBranch, 
  FileText, 
  AlertCircle, 
  GitPullRequest, 
  PlayCircle, 
  BookOpen,
  Shield,
  BarChart3,
  Star,
  Eye,
  GitFork,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  Download,
  Search,
  Code,
  FileImage,
  FileArchive,
  File,
  Trash2
} from 'lucide-react';
import { UploadedFile } from '../App';
import { apiClient } from '../lib/apiClient';

type RepoTab = 'code' | 'issues' | 'pull-requests' | 'actions' | 'wiki';

interface RepositoryViewProps {
  projectId: string;
  projectTitle: string;
  owner: string;
  userId: string;
  userName?: string;
  uploadedFiles?: UploadedFile[];
  readmeContent?: string;
  isOwner?: boolean;
  onAddFiles?: (files: UploadedFile[]) => void;
  onDeleteFile?: (fileId: string) => void;
  onUpdateReadme?: (readmeContent: string) => void | Promise<void>;
}

interface Issue {
  id: number;
  title: string;
  author: string;
  status: 'open' | 'closed';
  labels: string[];
  comments: number;
  created: string;
}

interface PullRequest {
  id: number;
  title: string;
  author: string;
  status: 'open' | 'merged' | 'closed';
  branch: string;
  targetBranch: string;
  comments: number;
  created: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  status: 'success' | 'failed' | 'in_progress';
  branch: string;
  commit: string;
  time: string;
  duration: string;
}

const README_FILE_ID = '__project_readme__';
const defaultReadmeContent = (projectTitle: string) => `# ${projectTitle}

Add your project overview, setup steps, and usage notes here.
`;

export function RepositoryView({ projectId, projectTitle, owner, userId, userName, uploadedFiles, readmeContent, isOwner, onAddFiles, onDeleteFile, onUpdateReadme }: RepositoryViewProps) {
  try {
    const [activeTab, setActiveTab] = useState<RepoTab>('code');
    const [currentBranch, setCurrentBranch] = useState('main');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploadArea, setShowUploadArea] = useState(false);
    const [localFiles, setLocalFiles] = useState<UploadedFile[]>(uploadedFiles ?? []);
    const [readmeDraft, setReadmeDraft] = useState(readmeContent || defaultReadmeContent(projectTitle));
    const [isEditingReadme, setIsEditingReadme] = useState(false);
    const [isSavingReadme, setIsSavingReadme] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setLocalFiles(uploadedFiles ?? []);
    }, [uploadedFiles]);

    useEffect(() => {
      setReadmeDraft(readmeContent || defaultReadmeContent(projectTitle));
    }, [projectTitle, readmeContent]);

    const visibleFiles = localFiles.filter((file) => file.id !== README_FILE_ID);

    const handleDownloadZip = async () => {
      const zipBlob = await apiClient.downloadProjectZip(projectId, userId);
      if ((zipBlob as any)?.error) {
        throw new Error((zipBlob as any).error);
      }
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `${projectTitle.replace(/[^a-z0-9-_]+/gi, '_') || 'project'}-repository.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(zipUrl);
    };

    const handleCodeButtonClick = () => {
      if (isOwner) {
        setShowUploadArea(prev => !prev);
        return;
      }
      // Non-owners keep current behavior (download, or no-op in this mock)
    };

    const handleFilesUpload = async (files: FileList | null) => {
      if (!files || files.length === 0) return;

    const newFiles = await Promise.all(
      Array.from(files).map(async file => {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] || '';
            resolve(base64);
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        return {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
          uploadedById: userId,
          uploadedByName: userName || owner,
          path: '',
          content,
        };
      })
    );

    const combined = [...localFiles, ...newFiles];
    setLocalFiles(combined);
    onAddFiles?.(newFiles);
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFilesUpload(event.target.files);
    event.target.value = '';
  };

  const handleSaveReadme = async () => {
    if (!onUpdateReadme || isSavingReadme) return;

    setIsSavingReadme(true);
    try {
      await onUpdateReadme(readmeDraft);
      setIsEditingReadme(false);
    } finally {
      setIsSavingReadme(false);
    }
  };

  const mockIssues: Issue[] = [
    {
      id: 1,
      title: 'Add dark mode support',
      author: 'student1',
      status: 'open',
      labels: ['enhancement', 'ui'],
      comments: 5,
      created: '2 days ago'
    },
    {
      id: 2,
      title: 'Fix authentication bug in login flow',
      author: 'student2',
      status: 'open',
      labels: ['bug', 'critical'],
      comments: 3,
      created: '3 days ago'
    },
    {
      id: 3,
      title: 'Improve documentation for API endpoints',
      author: owner,
      status: 'closed',
      labels: ['documentation'],
      comments: 2,
      created: '1 week ago'
    },
  ];

  const mockPRs: PullRequest[] = [
    {
      id: 1,
      title: 'Implement user profile page',
      author: 'student1',
      status: 'open',
      branch: 'feature/user-profile',
      targetBranch: 'main',
      comments: 7,
      created: '1 day ago'
    },
    {
      id: 2,
      title: 'Fix responsive design issues',
      author: 'student2',
      status: 'merged',
      branch: 'fix/responsive-layout',
      targetBranch: 'main',
      comments: 4,
      created: '3 days ago'
    },
  ];

  const mockWorkflows: WorkflowRun[] = [
    {
      id: 1,
      name: 'CI/CD Pipeline',
      status: 'success',
      branch: 'main',
      commit: 'Update dependencies',
      time: '2 hours ago',
      duration: '3m 24s'
    },
    {
      id: 2,
      name: 'Test Suite',
      status: 'success',
      branch: 'main',
      commit: 'Add unit tests',
      time: '5 hours ago',
      duration: '2m 15s'
    },
    {
      id: 3,
      name: 'CI/CD Pipeline',
      status: 'failed',
      branch: 'feature/user-profile',
      commit: 'Implement user profile',
      time: '1 day ago',
      duration: '1m 45s'
    },
  ];

  const tabs = [
    { id: 'code' as RepoTab, label: 'Code', icon: Code2 },
    { id: 'issues' as RepoTab, label: 'Issues', icon: AlertCircle, count: mockIssues.filter(i => i.status === 'open').length },
    { id: 'pull-requests' as RepoTab, label: 'Pull requests', icon: GitPullRequest, count: mockPRs.filter(pr => pr.status === 'open').length },
    { id: 'actions' as RepoTab, label: 'Actions', icon: PlayCircle },
    { id: 'wiki' as RepoTab, label: 'Wiki', icon: BookOpen },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Repository Header */}
      <div className="bg-white border border-slate-200 rounded-t-xl">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-slate-800">
                <span className="text-indigo-600">{owner}</span>
                <span className="text-slate-400 mx-2">/</span>
                <span>{projectTitle}</span>
              </h2>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-300">
                Public
              </span>
            </div>
            {/* <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                <Eye className="w-4 h-4" />
                Watch
                <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-xs rounded-full">12</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                <GitFork className="w-4 h-4" />
                Fork
                <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-xs rounded-full">3</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                <Star className="w-4 h-4" />
                Star
                <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-xs rounded-full">28</span>
              </button>
            </div> */}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition ${
                  isActive
                    ? 'border-amber-500 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-t-0 border-slate-200 rounded-b-xl">
        {activeTab === 'code' && (
          <div>
            {/* Branch and Actions Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                  <GitBranch className="w-4 h-4" />
                  {currentBranch}
                  <span className="ml-1 px-1.5 py-0.5 bg-slate-100 text-xs rounded-full">3 branches</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                  <FileText className="w-4 h-4" />
                  <span className="text-slate-500">24 commits</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void handleDownloadZip()}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  Download ZIP
                </button>
                {isOwner && (
                  <button
                    onClick={handleCodeButtonClick}
                    className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    {showUploadArea ? 'Hide Upload' : 'Code / Upload'}
                  </button>
                )}
              </div>
            </div>

            {isOwner && showUploadArea && (
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Upload files to repository</h3>
                <p className="text-xs text-slate-500 mb-3">Select one or more files to add to your repository.</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                  >
                    Choose files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <span className="text-xs text-slate-500">{visibleFiles.length} file(s) currently in this repo</span>
                </div>
              </div>
            )}

            {/* Latest Commit Info */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-700 font-semibold text-xs">{owner.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium text-slate-800">{owner}</span>
                <span className="text-sm text-slate-600">Update dependencies</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">a3f2c9b</span>
                <Clock className="w-4 h-4" />
                <span>6 hours ago</span>
              </div>
            </div>

            {/* File Browser */}
            {visibleFiles.length > 0 ? (
              <div className="px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Uploaded Files</h3>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  {visibleFiles.map(file => {
                    try {
                      const toBase64 = (value: string) => {
                        try {
                          return btoa(unescape(encodeURIComponent(value)));
                        } catch (e) {
                          try {
                            return btoa(value);
                          } catch {
                            return '';
                          }
                        }
                      };

                      const isPossiblyBase64 = /^[A-Za-z0-9+/=\n\r]+$/.test(file.content || '');
                      const base64Value = isPossiblyBase64 ? file.content : toBase64(file.content || '');
                      const downloadHref = base64Value ? `data:${file.type || 'application/octet-stream'};base64,${base64Value}` : '#';

                      const fileSizeKB = file.size ? Math.round(file.size / 1024) : 0;
                      const uploadDate = file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : 'Unknown';

                      return (
                        <div key={file.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{file.name || 'Unnamed file'}</p>
                            <p className="text-xs text-slate-500">{file.path || 'root'} • {fileSizeKB} KB • {uploadDate}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={downloadHref}
                              download={file.name}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </a>
                            {isOwner && (
                              <button
                                onClick={() => onDeleteFile?.(file.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    } catch (error) {
                      console.error('Error rendering file:', file, error);
                      return (
                        <div key={file.id || Math.random()} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 bg-red-50">
                          <div>
                            <p className="text-sm font-medium text-red-800">Error loading file</p>
                            <p className="text-xs text-red-600">File data corrupted</p>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            ) : (
              <div className="px-6 py-4">
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  No repository files uploaded yet.
                </div>
              </div>
            )}

            {/* README Preview */}
            <div className="px-6 py-6 border-t border-slate-200">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-800">README.md</h3>
                </div>
                {isOwner && (
                  <div className="flex items-center gap-2">
                    {isEditingReadme ? (
                      <>
                        <button
                          onClick={() => {
                            setReadmeDraft(readmeContent || defaultReadmeContent(projectTitle));
                            setIsEditingReadme(false);
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => void handleSaveReadme()}
                          disabled={isSavingReadme}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:bg-slate-300 disabled:text-slate-500"
                        >
                          {isSavingReadme ? 'Saving...' : 'Save README'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditingReadme(true)}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition"
                      >
                        Edit README
                      </button>
                    )}
                  </div>
                )}
              </div>
              {isEditingReadme ? (
                <textarea
                  value={readmeDraft}
                  onChange={(event) => setReadmeDraft(event.target.value)}
                  className="w-full min-h-[320px] rounded-xl border border-slate-300 bg-slate-950 text-slate-100 p-4 font-mono text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  spellCheck={false}
                />
              ) : (
                <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700 overflow-x-auto">
                  {readmeDraft}
                </pre>
              )}
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="p-6">
            {/* Issues Toolbar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm">
                New issue
              </button>
            </div>

            {/* Issues Filters */}
            <div className="flex items-center gap-4 mb-4 text-sm">
              <button className="font-medium text-slate-900">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                {mockIssues.filter(i => i.status === 'open').length} Open
              </button>
              <button className="font-medium text-slate-600 hover:text-slate-900">
                <XCircle className="w-4 h-4 inline mr-1" />
                {mockIssues.filter(i => i.status === 'closed').length} Closed
              </button>
            </div>

            {/* Issues List */}
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
              {mockIssues.map(issue => (
                <div key={issue.id} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start gap-3">
                    {issue.status === 'open' ? (
                      <Circle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer mb-1">
                        {issue.title}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-slate-600 flex-wrap">
                        <span>#{issue.id}</span>
                        <span>opened {issue.created}</span>
                        <span>by {issue.author}</span>
                        {issue.labels.map(label => (
                          <span
                            key={label}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                    {issue.comments > 0 && (
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <AlertCircle className="w-4 h-4" />
                        {issue.comments}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pull-requests' && (
          <div className="p-6">
            {/* PR Toolbar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search pull requests..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm">
                New pull request
              </button>
            </div>

            {/* PR Filters */}
            <div className="flex items-center gap-4 mb-4 text-sm">
              <button className="font-medium text-slate-900">
                <GitPullRequest className="w-4 h-4 inline mr-1" />
                {mockPRs.filter(pr => pr.status === 'open').length} Open
              </button>
              <button className="font-medium text-slate-600 hover:text-slate-900">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                {mockPRs.filter(pr => pr.status === 'merged').length} Merged
              </button>
              <button className="font-medium text-slate-600 hover:text-slate-900">
                <XCircle className="w-4 h-4 inline mr-1" />
                {mockPRs.filter(pr => pr.status === 'closed').length} Closed
              </button>
            </div>

            {/* PR List */}
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
              {mockPRs.map(pr => (
                <div key={pr.id} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start gap-3">
                    {pr.status === 'open' ? (
                      <GitPullRequest className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : pr.status === 'merged' ? (
                      <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer mb-1">
                        {pr.title}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-slate-600 flex-wrap">
                        <span>#{pr.id}</span>
                        <span>opened {pr.created}</span>
                        <span>by {pr.author}</span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {pr.branch} → {pr.targetBranch}
                        </span>
                      </div>
                    </div>
                    {pr.comments > 0 && (
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <AlertCircle className="w-4 h-4" />
                        {pr.comments}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">All workflows</h3>
              <p className="text-sm text-slate-600">
                Showing workflow runs for all branches and tags
              </p>
            </div>

            {/* Workflow Runs */}
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
              {mockWorkflows.map(workflow => (
                <div key={workflow.id} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start gap-4">
                    {workflow.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : workflow.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0 animate-pulse" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900">{workflow.name}</h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          workflow.status === 'success'
                            ? 'bg-green-100 text-green-700'
                            : workflow.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {workflow.status === 'in_progress' ? 'In progress' : workflow.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span>{workflow.commit}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {workflow.branch}
                        </span>
                        <span>•</span>
                        <span>{workflow.time}</span>
                        <span>•</span>
                        <span>{workflow.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'wiki' && (
          <div className="p-8 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Welcome to the Wiki</h3>
            <p className="text-slate-600 mb-4">
              Wikis provide a place in your repository to lay out the roadmap of your project,
              show the current status, and document software better.
            </p>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
              Create the first page
            </button>
          </div>
        )}
      </div>
    </div>
  );
  } catch (error) {
    console.error('RepositoryView error:', error);
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Repository Error</h3>
          <p className="text-red-700 mb-4">
            There was an error loading the repository view. Please try refreshing the page.
          </p>
          <details className="text-sm text-red-600">
            <summary className="cursor-pointer">Error details</summary>
            <pre className="mt-2 whitespace-pre-wrap">{error instanceof Error ? error.message : String(error)}</pre>
          </details>
        </div>
      </div>
    );
  }
}

