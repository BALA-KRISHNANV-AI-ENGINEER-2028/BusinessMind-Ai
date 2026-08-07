import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import type { DocumentItem } from '../../../services/documents.service';
import { documentsService } from '../../../services/documents.service';
import { Download, RefreshCw, Trash2, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

interface DocumentDetailsModalProps {
  document: DocumentItem | null;
  onClose: () => void;
  onRefresh: () => void;
}

export function DocumentDetailsModal({ document, onClose, onRefresh }: DocumentDetailsModalProps) {
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  if (!document) return null;

  async function handleReprocess() {
    if (!document) return;
    setIsReprocessing(true);
    try {
      await documentsService.reprocessDocument(document.id);
      showToast({
        title: 'Reprocessing triggered',
        description: 'Document extraction pipeline re-initiated.',
        variant: 'info',
      });
      onRefresh();
    } catch (err) {
      showToast({
        title: 'Reprocess failed',
        description: err instanceof Error ? err.message : 'Failed to reprocess document',
        variant: 'danger',
      });
    } finally {
      setIsReprocessing(false);
    }
  }

  async function handleDelete() {
    if (!document) return;
    setIsDeleting(true);
    try {
      await documentsService.deleteDocument(document.id);
      showToast({
        title: 'Document deleted',
        description: `'${document.displayName}' has been soft-deleted.`,
        variant: 'success',
      });
      onRefresh();
      onClose();
    } catch (err) {
      showToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Failed to delete document',
        variant: 'danger',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const downloadUrl = documentsService.getDownloadUrl(document.id);

  return (
    <Modal open={Boolean(document)} onClose={onClose} title="Document Details" description="Metadata & lifecycle trace">
      <div className="space-y-6 text-sm">
        {/* Header Summary */}
        <div className="flex items-start justify-between gap-3 p-4 rounded-lg border border-border bg-bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent-subtle text-accent-text shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary text-base">{document.displayName}</h4>
              <p className="text-xs text-text-secondary">{document.originalFilename}</p>
            </div>
          </div>
          <DocumentStatusBadge status={document.processingStatus} />
        </div>

        {/* State Machine Status Progress */}
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Processing Pipeline</h5>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex-1 space-y-1">
              <div className="flex justify-between font-medium text-text-secondary">
                <span>Status: {document.processingStatus}</span>
                <span>{document.processingProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${document.processingProgress}%` }}
                />
              </div>
            </div>
          </div>

          {document.processingError && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Processing Failure</p>
                <p>{document.processingError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4">
          <div>
            <span className="text-xs text-text-secondary">File Size</span>
            <p className="font-medium text-text-primary">{(document.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
          <div>
            <span className="text-xs text-text-secondary">File Format</span>
            <p className="font-medium uppercase text-text-primary">{document.fileType}</p>
          </div>
          <div>
            <span className="text-xs text-text-secondary">Current Version</span>
            <p className="font-medium text-text-primary">v{document.currentVersion}</p>
          </div>
          <div>
            <span className="text-xs text-text-secondary">Storage Provider</span>
            <p className="font-medium capitalize text-text-primary">{document.storageProvider}</p>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-text-secondary">SHA-256 Checksum</span>
            <p className="font-mono text-xs text-text-primary truncate">{document.checksum}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button variant="secondary" size="sm" onClick={handleReprocess} disabled={isReprocessing}>
            <RefreshCw size={14} className={isReprocessing ? 'animate-spin' : ''} />
            Reprocess
          </Button>

          <div className="flex gap-2">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-bg-muted text-text-primary transition-colors"
            >
              <Download size={14} />
              Download
            </a>
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
