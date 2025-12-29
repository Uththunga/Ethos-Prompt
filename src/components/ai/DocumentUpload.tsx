import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { aiService } from '@/services/aiService';
import { documentDebugger, isJobLikelyStuck } from '@/utils/documentDebugger';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'completed' | 'error';
  progress: number;
  jobId?: string;
  documentId?: string;
  error?: string;
  uploadStartTime?: Date;
  uploadEndTime?: Date;
  processingStartTime?: Date;
  processingEndTime?: Date;
  retryCount?: number;
}

interface DocumentUploadProps {
  onUploadComplete?: (documentId: string, filename: string) => void;
  onUploadStart?: (filename: string) => void;
  onUploadProgress?: (filename: string, progress: number, status: string) => void;
  onUploadError?: (filename: string, error: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  autoUpload?: boolean;
  showDetailedProgress?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadComplete,
  onUploadStart,
  onUploadProgress,
  onUploadError,
  maxFiles = 10,
  maxFileSize = 50,
  acceptedTypes = ['.pdf', '.docx', '.txt', '.md'],
  className = '',
  autoUpload = false,
  showDetailedProgress = true,
  enableRetry = true,
  maxRetries = 3
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activePollingRef = useRef<Set<string>>(new Set()); // Track active polling operations
  const { toast } = useToast();

  // Cleanup polling operations on unmount
  useEffect(() => {
    return () => {
      activePollingRef.current.clear();
    };
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);

    // Check total file limit
    if (files.length + fileArray.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed`,
        variant: 'destructive',
      });
      return;
    }

    const validFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);

      if (error) {
        toast({
          title: 'Invalid file',
          description: `${file.name}: ${error}`,
          variant: 'destructive',
        });
        continue;
      }

      // Check for duplicates
      if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
        toast({
          title: 'Duplicate file',
          description: `${file.name} is already added`,
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        status: 'pending',
        progress: 0
      });
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFile = useCallback(async (uploadedFile: UploadedFile, retryCount = 0) => {
    setFiles(prev => prev.map(f =>
      f.id === uploadedFile.id
        ? {
            ...f,
            status: 'uploading',
            progress: 0,
            uploadStartTime: new Date(),
            retryCount
          }
        : f
    ));

    // Call onUploadStart callback
    onUploadStart?.(uploadedFile.file.name);

    try {
      const response = await aiService.uploadDocument(uploadedFile.file);

      if (!response.success) {
        throw new Error(response.error || 'Upload failed');
      }

      // Update file status to processing
      setFiles(prev => prev.map(f =>
        f.id === uploadedFile.id
          ? {
              ...f,
              status: 'processing',
              progress: 25,
              jobId: response.job_id,
              documentId: response.document_id,
              uploadEndTime: new Date(),
              processingStartTime: new Date()
            }
          : f
      ));

      // Poll for processing status with enhanced progress tracking
      pollProcessingStatus(uploadedFile.id, response.job_id);

    } catch (error) {
      console.error('Upload error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      // Retry logic
      if (enableRetry && retryCount < maxRetries && !aiService.isAuthError(error as Error)) {
        toast({
          title: 'Retrying Upload',
          description: `Attempt ${retryCount + 1} of ${maxRetries} for ${uploadedFile.file.name}`,
        });

        setTimeout(() => {
          uploadFile(uploadedFile, retryCount + 1);
        }, Math.pow(2, retryCount) * 1000); // Exponential backoff

        return;
      }

      setFiles(prev => prev.map(f =>
        f.id === uploadedFile.id
          ? {
              ...f,
              status: 'error',
              error: errorMessage,
              retryCount
            }
          : f
      ));

      // Call onUploadError callback
      onUploadError?.(uploadedFile.file.name, errorMessage);

      toast({
        title: 'Upload Failed',
        description: `${uploadedFile.file.name}: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  }, [onUploadStart, onUploadError, enableRetry, maxRetries]);

  const pollProcessingStatus = async (fileId: string, jobId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    // Add to active polling set
    activePollingRef.current.add(jobId);

    // Start debugging
    documentDebugger.startDebugging(jobId);

    const poll = async () => {
      // Check if polling should continue
      if (!activePollingRef.current.has(jobId)) {
        console.log(`Polling stopped for job ${jobId} (component unmounted or cancelled)`);
        documentDebugger.stopDebugging(jobId);
        return;
      }

      try {
        const response = await fetch(`/api/ai/document-status/${jobId}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Log polling attempt for debugging
        documentDebugger.logPollAttempt(jobId, data);

        // Check if API call was successful
        if (!data.success) {
          throw new Error(data.error || 'API call failed');
        }

        console.log(`Polling status for job ${jobId}:`, data.status); // Debug log

        if (data.status === 'completed') {
          // Remove from active polling
          activePollingRef.current.delete(jobId);
          documentDebugger.stopDebugging(jobId);

          setFiles(prev => prev.map(f =>
            f.id === fileId
              ? { ...f, status: 'completed', progress: 100 }
              : f
          ));

          const file = files.find(f => f.id === fileId);
          if (file && onUploadComplete) {
            onUploadComplete(data.document_id, file.file.name);
          }

          toast({
            title: 'Document processed',
            description: `${file?.file.name} is ready for search`,
          });

        } else if (data.status === 'failed') {
          // Remove from active polling
          activePollingRef.current.delete(jobId);
          documentDebugger.stopDebugging(jobId);

          setFiles(prev => prev.map(f =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'error',
                  error: data.error_message || 'Processing failed'
                }
              : f
          ));

        } else if (attempts < maxAttempts) {
          // Check if job appears to be stuck
          if (attempts > 10 && isJobLikelyStuck(jobId)) {
            console.warn(`Job ${jobId} appears to be stuck. Debug report:`);
            console.warn(documentDebugger.generateDebugReport(jobId));
          }

          // Update progress based on processing steps
          const progressMap = {
            'extracting': 25,
            'chunking': 50,
            'embedding': 75,
            'indexing': 90
          };

          const progress = progressMap[data.status as keyof typeof progressMap] || 50;

          setFiles(prev => prev.map(f =>
            f.id === fileId
              ? { ...f, progress }
              : f
          ));

          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          // Timeout - stop polling after maxAttempts
          activePollingRef.current.delete(jobId);
          console.warn(`Document processing timeout for job ${jobId} after ${maxAttempts} attempts`);
          console.warn('Final debug report:', documentDebugger.generateDebugReport(jobId));
          documentDebugger.stopDebugging(jobId);

          setFiles(prev => prev.map(f =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'error',
                  error: 'Processing timeout - please try uploading again'
                }
              : f
          ));
        }

      } catch (error) {
        // Remove from active polling on error
        activePollingRef.current.delete(jobId);
        documentDebugger.logError(jobId, (error as Error).message);
        console.error('Status polling error:', error);
        console.error('Debug report:', documentDebugger.generateDebugReport(jobId));
        documentDebugger.stopDebugging(jobId);

        setFiles(prev => prev.map(f =>
          f.id === fileId
            ? {
                ...f,
                status: 'error',
                error: 'Failed to check processing status'
              }
            : f
        ));
      }
    };

    poll();
  };

  const uploadAllFiles = () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    pendingFiles.forEach(uploadFile);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [files]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return <File className="w-4 h-4 text-gray-400" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case 'pending':
        return 'Ready to upload';
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Ready for search';
      case 'error':
        return file.error || 'Error';
      default:
        return 'Unknown';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pendingFilesCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supported formats: {acceptedTypes.join(', ')} • Max size: {maxFileSize}MB
          </p>

          <input
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />

          <Button asChild variant="outline">
            <label htmlFor="file-upload" className="cursor-pointer">
              Select Files
            </label>
          </Button>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Files ({files.length})</CardTitle>
              {pendingFilesCount > 0 && (
                <Button onClick={uploadAllFiles} size="sm">
                  Upload All ({pendingFilesCount})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {getStatusIcon(file.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{file.file.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(file.file.size)}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    {getStatusText(file)}
                  </div>

                  {(file.status === 'uploading' || file.status === 'processing') && (
                    <Progress value={file.progress} className="h-2" />
                  )}
                </div>

                <div className="flex-shrink-0 flex gap-2">
                  {file.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => uploadFile(file)}
                    >
                      Upload
                    </Button>
                  )}

                  {file.status !== 'uploading' && file.status !== 'processing' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
