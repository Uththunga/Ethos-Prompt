import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentUpload } from '../DocumentUpload';

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('DocumentUpload Component', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders upload interface correctly', () => {
    render(<DocumentUpload />);
    
    expect(screen.getByText('Upload Documents')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop files here, or click to select files')).toBeInTheDocument();
    expect(screen.getByText('Select Files')).toBeInTheDocument();
    expect(screen.getByText('Supported formats: .pdf, .docx, .txt, .md • Max size: 50MB')).toBeInTheDocument();
  });

  it('handles file selection via input', async () => {
    const user = userEvent.setup();
    
    render(<DocumentUpload />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Select Files');
    
    await user.upload(input, file);
    
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText('Ready to upload')).toBeInTheDocument();
  });

  it('validates file size limits', async () => {
    const user = userEvent.setup();
    const mockToast = jest.fn();
    
    jest.mocked(require('@/components/ui/use-toast').useToast).mockReturnValue({
      toast: mockToast,
    });
    
    render(<DocumentUpload maxFileSize={1} />); // 1MB limit
    
    // Create a file larger than 1MB
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Select Files');
    
    await user.upload(input, largeFile);
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Invalid file',
      description: 'large.txt: File size exceeds 1MB limit',
      variant: 'destructive',
    });
  });

  it('validates file types', async () => {
    const user = userEvent.setup();
    const mockToast = jest.fn();
    
    jest.mocked(require('@/components/ui/use-toast').useToast).mockReturnValue({
      toast: mockToast,
    });
    
    render(<DocumentUpload acceptedTypes={['.txt']} />);
    
    const invalidFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Select Files');
    
    await user.upload(input, invalidFile);
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Invalid file',
      description: 'test.jpg: File type not supported. Accepted types: .txt',
      variant: 'destructive',
    });
  });

  it('prevents duplicate file uploads', async () => {
    const user = userEvent.setup();
    const mockToast = jest.fn();
    
    jest.mocked(require('@/components/ui/use-toast').useToast).mockReturnValue({
      toast: mockToast,
    });
    
    render(<DocumentUpload />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Select Files');
    
    // Upload same file twice
    await user.upload(input, file);
    await user.upload(input, file);
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Duplicate file',
      description: 'test.txt is already added',
      variant: 'destructive',
    });
  });

  it('enforces maximum file count', async () => {
    const user = userEvent.setup();
    const mockToast = jest.fn();
    
    jest.mocked(require('@/components/ui/use-toast').useToast).mockReturnValue({
      toast: mockToast,
    });
    
    render(<DocumentUpload maxFiles={1} />);
    
    const file1 = new File(['content 1'], 'test1.txt', { type: 'text/plain' });
    const file2 = new File(['content 2'], 'test2.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Select Files');
    
    await user.upload(input, file1);
    await user.upload(input, file2);
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Too many files',
      description: 'Maximum 1 files allowed',
      variant: 'destructive',
    });
  });

  it('uploads file successfully', async () => {
    const user = userEvent.setup();
    const mockOnUploadComplete = jest.fn();
    
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          job_id: 'job_123',
          document_id: 'doc_456',
          status: 'processing',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'completed',
          document_id: 'doc_456',
        }),
      });
    
    render(<DocumentUpload onUploadComplete={mockOnUploadComplete} />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Select Files');
    
    await user.upload(input, file);
    
    const uploadButton = screen.getByText('Upload');
    await user.click(uploadButton);
    
    // Check upload API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/ai/upload-document', {
        method: 'POST',
        body: expect.any(FormData),
      });
    });
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByText('Ready for search')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    expect(mockOnUploadComplete).toHaveBeenCalledWith('doc_456', 'test.txt');
  });

  it('handles upload errors', async () => {
    const user = userEvent.setup();
    
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Upload failed'));
    
    render(<DocumentUpload />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Select Files');
    
    await user.upload(input, file);
    
    const uploadButton = screen.getByText('Upload');
    await user.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  it('shows upload progress', async () => {
    const user = userEvent.setup();
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        job_id: 'job_123',
        document_id: 'doc_456',
        status: 'processing',
      }),
    });
    
    render(<DocumentUpload />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Select Files');
    
    await user.upload(input, file);
    
    const uploadButton = screen.getByText('Upload');
    await user.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  it('allows file removal', async () => {
    const user = userEvent.setup();
    
    render(<DocumentUpload />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Select Files');
    
    await user.upload(input, file);
    
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    
    const removeButton = screen.getByRole('button', { name: '' }); // X button
    await user.click(removeButton);
    
    expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
  });

  it('uploads all files at once', async () => {
    const user = userEvent.setup();
    
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        job_id: 'job_123',
        document_id: 'doc_456',
        status: 'processing',
      }),
    });
    
    render(<DocumentUpload />);
    
    const file1 = new File(['content 1'], 'test1.txt', { type: 'text/plain' });
    const file2 = new File(['content 2'], 'test2.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Select Files');
    
    await user.upload(input, [file1, file2]);
    
    const uploadAllButton = screen.getByText('Upload All (2)');
    await user.click(uploadAllButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('handles drag and drop', async () => {
    render(<DocumentUpload />);
    
    const dropZone = screen.getByText('Upload Documents').closest('div');
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.dragOver(dropZone!, {
      dataTransfer: {
        files: [file],
      },
    });
    
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file],
      },
    });
    
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });

  it('formats file sizes correctly', async () => {
    const user = userEvent.setup();
    
    render(<DocumentUpload />);
    
    const file = new File(['x'.repeat(1024)], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Select Files');
    
    await user.upload(input, file);
    
    expect(screen.getByText('1 KB')).toBeInTheDocument();
  });

  it('shows processing status updates', async () => {
    const user = userEvent.setup();
    
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          job_id: 'job_123',
          document_id: 'doc_456',
          status: 'processing',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'extracting',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'chunking',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'embedding',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'completed',
          document_id: 'doc_456',
        }),
      });
    
    render(<DocumentUpload />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText('Select Files');
    
    await user.upload(input, file);
    
    const uploadButton = screen.getByText('Upload');
    await user.click(uploadButton);
    
    // Should eventually show completed status
    await waitFor(() => {
      expect(screen.getByText('Ready for search')).toBeInTheDocument();
    }, { timeout: 30000 });
  });
});
