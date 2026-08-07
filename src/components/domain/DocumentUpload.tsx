import { useCallback, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { documentsService } from '../../services/documents.service';
import { useToast } from '../../hooks/useToast';

interface DocumentUploadProps {
  onSuccess?: () => void;
  knowledgeBaseId?: string;
  accept?: string;
  multiple?: boolean;
}

interface UploadingFileItem {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.csv', '.txt', '.md'];

export function DocumentUpload({
  onSuccess,
  knowledgeBaseId,
  accept = '.pdf,.docx,.xlsx,.csv,.txt,.md',
  multiple = true,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [items, setItems] = useState<UploadingFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList);
    const validItems: UploadingFileItem[] = [];

    for (const file of newFiles) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        showToast({
          title: 'Unsupported file type',
          description: `'${file.name}' is not supported. Allowed: PDF, DOCX, XLSX, CSV, TXT, MD.`,
          variant: 'danger',
        });
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        showToast({
          title: 'File too large',
          description: `'${file.name}' exceeds the 25MB limit.`,
          variant: 'danger',
        });
        continue;
      }
      validItems.push({ file, status: 'pending' });
    }

    setItems((prev) => [...prev, ...validItems]);
  }, [showToast]);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUploadAll() {
    if (items.length === 0 || isUploading) return;
    setIsUploading(true);

    let successCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === 'success') continue;

      setItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: 'uploading' } : it)),
      );

      try {
        await documentsService.uploadFile(item.file, knowledgeBaseId);
        setItems((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'success' } : it)),
        );
        successCount++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setItems((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'error', error: errorMsg } : it)),
        );
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      showToast({
        title: 'Upload successful',
        description: `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}. Processing started.`,
        variant: 'success',
      });
      if (onSuccess) {
        onSuccess();
      }
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors duration-150',
          isDragging ? 'border-accent bg-accent-subtle' : 'border-border hover:border-border-strong',
        )}
      >
        <UploadCloud size={28} className="text-accent-text" aria-hidden="true" />
        <p className="text-sm font-medium text-text-primary">
          Drag and drop files here, or <span className="text-accent-text underline">browse</span>
        </p>
        <p className="text-xs text-text-secondary">PDF, DOCX, XLSX, CSV, TXT, MD up to 25MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          <ul className="max-h-48 overflow-y-auto space-y-2">
            {items.map((item, index) => (
              <li
                key={`${item.file.name}-${index}`}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm bg-bg-muted/30"
              >
                <FileIcon size={16} className="shrink-0 text-text-secondary" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">{item.file.name}</p>
                  <p className="text-xs text-text-secondary">
                    {(item.file.size / 1024).toFixed(0)} KB
                  </p>
                </div>

                {item.status === 'uploading' && (
                  <Loader2 size={16} className="animate-spin text-accent-text shrink-0" />
                )}
                {item.status === 'success' && (
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                )}
                {item.status === 'error' && (
                  <div className="flex items-center gap-1 text-xs text-rose-500">
                    <AlertCircle size={14} />
                    <span>Failed</span>
                  </div>
                )}

                {item.status === 'pending' && !isUploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(index);
                    }}
                    className="shrink-0 rounded p-1 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isUploading || items.length === 0}
              onClick={handleUploadAll}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                'Start Upload'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
