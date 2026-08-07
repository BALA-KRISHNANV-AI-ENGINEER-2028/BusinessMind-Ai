import { useState } from 'react';
import { FileText, LayoutGrid, List, Plus, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '../../components/ui/Table';
import type { TableColumn } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { DocumentUpload } from '../../components/domain';
import { DocumentStatusBadge } from './components/DocumentStatusBadge';
import { DocumentCard } from './components/DocumentCard';
import { DocumentsFilter } from './components/DocumentsFilter';
import { DocumentDetailsModal } from './components/DocumentDetailsModal';
import { useDebounce } from '../../hooks/useDebounce';
import { documentsService } from '../../services/documents.service';
import type { DocumentItem } from '../../services/documents.service';
import { QUERY_KEYS } from '../../constants';

export function DocumentsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const currentPage = 1;
  const pageSize = 10;

  const debouncedSearch = useDebounce(searchInput, 300);

  const { data: docsRes, refetch } = useQuery({
    queryKey: [QUERY_KEYS.DOCUMENTS, currentPage, debouncedSearch, status, category],
    queryFn: () =>
      documentsService.getDocuments({
        page: currentPage,
        pageSize,
        search: debouncedSearch,
        status: status !== 'all' ? status : undefined,
        fileType: category !== 'all' ? category : undefined,
      }),
  });

  const documents = docsRes?.success ? docsRes.data : [];

  const columns: TableColumn<DocumentItem>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (doc) => (
        <div
          className="flex items-center gap-2 cursor-pointer hover:text-accent-text transition-colors"
          onClick={() => setSelectedDocument(doc)}
        >
          <FileText size={16} className="shrink-0 text-text-secondary" aria-hidden="true" />
          <div>
            <span className="font-medium">{doc.displayName}</span>
            <p className="text-xs text-text-secondary">{doc.originalFilename}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (doc) => <DocumentStatusBadge status={doc.processingStatus} />,
    },
    {
      key: 'fileSize',
      header: 'Size',
      render: (doc) => `${(doc.fileSize / (1024 * 1024)).toFixed(2)} MB`,
    },
    {
      key: 'currentVersion',
      header: 'Version',
      render: (doc) => `v${doc.currentVersion}`,
    },
    {
      key: 'createdAt',
      header: 'Uploaded Date',
      sortable: true,
      render: (doc) => new Date(doc.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (doc) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDocument(doc)}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-muted"
            title="View Details"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        description="Upload and manage source business documents for your knowledge base."
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            Upload Document
          </Button>
        }
      />

      {/* Filter bar */}
      <DocumentsFilter
        search={searchInput}
        status={status}
        category={category}
        onSearchChange={setSearchInput}
        onStatusChange={setStatus}
        onCategoryChange={setCategory}
      />

      {/* View mode toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          {documents.length} document{documents.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex gap-1 rounded-md border border-border p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            className={`rounded p-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-accent-subtle text-accent-text'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            className={`rounded p-1.5 transition-colors ${
              viewMode === 'grid'
                ? 'bg-accent-subtle text-accent-text'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Documents view */}
      {viewMode === 'list' ? (
        <Table
          columns={columns}
          data={documents}
          keyExtractor={(doc) => doc.id}
          emptyTitle="No documents found"
          emptyDescription="Try adjusting your filters, or upload a new document to get started."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDocument(doc)}
              className="cursor-pointer"
            >
              <DocumentCard
                document={{
                  id: doc.id,
                  name: doc.displayName,
                  updatedLabel: new Date(doc.createdAt).toLocaleDateString(),
                  fileType: doc.fileType,
                  status: doc.processingStatus === 'READY' ? 'processed' : doc.processingStatus === 'FAILED' ? 'failed' : 'processing',
                  sizeLabel: `${(doc.fileSize / (1024 * 1024)).toFixed(2)} MB`,
                  uploadedBy: 'Org User',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload documents"
        description="Files are validated, encrypted, and parsed automatically after upload."
      >
        <DocumentUpload
          onSuccess={() => {
            setUploadOpen(false);
            refetch();
          }}
        />
      </Modal>

      {/* Document Details Drawer / Modal */}
      <DocumentDetailsModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        onRefresh={() => {
          refetch();
        }}
      />
    </div>
  );
}
