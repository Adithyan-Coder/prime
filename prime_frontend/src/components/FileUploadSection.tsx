import { useState, useRef } from 'react';
import { Upload, File, Folder, X, FileText, Code, FileImage, FileArchive, Download } from 'lucide-react';
import { UploadedFile } from '../App';

interface FileUploadSectionProps {
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

export function FileUploadSection({ uploadedFiles, onFilesChange }: FileUploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [folderPath, setFolderPath] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const newUploadedFiles: UploadedFile[] = files.map(file => {
      const reader = new FileReader();
      let content = '';

      // Read text files for preview
      if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.json')) {
        reader.readAsText(file);
        reader.onload = () => {
          content = reader.result as string;
        };
      }

      return {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        content: content,
        path: folderPath || undefined,
      };
    });

    onFilesChange([...uploadedFiles, ...newUploadedFiles]);
  };

  const handleRemoveFile = (fileId: string) => {
    onFilesChange(uploadedFiles.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    if (fileType.includes('image')) return FileImage;
    if (fileType.includes('zip') || fileType.includes('compressed')) return FileArchive;
    if (fileName.endsWith('.md') || fileName.endsWith('.txt')) return FileText;
    if (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.tsx') || 
        fileName.endsWith('.jsx') || fileName.endsWith('.py') || fileName.endsWith('.java')) return Code;
    return File;
  };

  // Group files by folder path
  const groupedFiles = uploadedFiles.reduce((acc, file) => {
    const path = file.path || 'root';
    if (!acc[path]) acc[path] = [];
    acc[path].push(file);
    return acc;
  }, {} as Record<string, UploadedFile[]>);

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Repository Files
      </label>
      <p className="text-sm text-slate-600 mb-4">
        Upload your code files, README, documentation, and other project resources
      </p>

      {/* Folder Path Input */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-600 mb-2">
          Upload to folder (optional)
        </label>
        <input
          type="text"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          placeholder="e.g., src/components or docs"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
        />
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-slate-100'
        }`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
        <p className="font-medium text-slate-700 mb-1">
          Drag and drop files here
        </p>
        <p className="text-sm text-slate-500 mb-4">
          or click to browse from your computer
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition text-sm"
        >
          Choose Files
        </button>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700">
              Uploaded Files ({uploadedFiles.length})
            </h4>
            <button
              type="button"
              onClick={() => onFilesChange([])}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedFiles).map(([path, files]) => (
              <div key={path} className="border border-slate-200 rounded-lg overflow-hidden">
                {path !== 'root' && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200">
                    <Folder className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-slate-700">{path}</span>
                  </div>
                )}
                <div className="divide-y divide-slate-200">
                  {files.map(file => {
                    const Icon = getFileIcon(file.name, file.type);
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50 transition"
                      >
                        <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-900 mb-2">💡 Quick Tips:</p>
        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
          <li>Upload your README.md file for better project visibility</li>
          <li>Organize files using folder paths (e.g., "src", "docs", "tests")</li>
          <li>Include documentation, code samples, and reports</li>
          <li>Supported formats: Code files, PDFs, images, markdown, and more</li>
        </ul>
      </div>
    </div>
  );
}
