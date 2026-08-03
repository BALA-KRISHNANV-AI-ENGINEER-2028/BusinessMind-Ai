import { useMemo, useState } from 'react';
import { FileText, LayoutGrid, List, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '../../components/ui/Table';
import type { TableColumn } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { PageHeader } from '../../components/ui/PageHeader';
import { DocumentUpload } from '../../components/domain';
import { DocumentStatusBadge } from './components/DocumentStatusBadge';
import { DocumentCard } from './components/DocumentCard';
import { DocumentsFilter } from './components/DocumentsFilter';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { documentsService } from '../../services/documents.service';
import { QUERY_KEYS } from '../../constants';
import type { DocumentSummary } from '../../types/business';

const columns: TableColumn<DocumentSummary>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (doc) => (
      <div className="flex items-center gap-2">
        <FileText size={16} className="shrink-0 text-text-secondary" aria-hidden="true" />
        <div>
          <span className="font-medium">{doc.name}</span>
          {doc.category && (
            <p className="text-xs text-text-secondary">{doc.category}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (doc) => (doc.status ? <DocumentStatusBadge status={doc.status} /> : null),
  },
  { key: 'sizeLabel', header: 'Size' },
  { key: 'uploadedBy', header: 'Uploaded by' },
  { key: 'updatedLabel', header: 'Updated', sortable: true },
];

export function DocumentsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [uploadOpen, setUploadOpen] = useState(false);
  const { showToast } = useToast();

  const debouncedSearch = useDebounce(searchInput, 300);

  const { data: docsRes } = useQuery({
    queryKey: QUERY_KEYS.DOCUMENTS,
    queryFn: () => documentsService.getDocuments(),
  });

  const allDocuments = docsRes?.success ? docsRes.data : [];

  const filtered = useMemo(() => {
    return allDocuments.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = status === 'all' || doc.status === status;
      const matchesCategory = category === 'all' || doc.category === category;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [allDocuments, debouncedSearch, status, category]);

  const { currentPage, totalPages, startIndex, endIndex, setPage } = usePagination({
    totalItems: filtered.length,
    initialPageSize: 6,
  });

  const pageDocuments = filtered.slice(startIndex, endIndex);

  function handleFilesSelected(files: File[]) {
    showToast({
      title: `${files.length} file${files.length > 1 ? 's' : ''} queued`,
      description: 'Documents will appear here once processing completes.',
      variant: 'info',
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        description="Upload and manage source documents for your knowledge base."
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            Upload
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
          {filtered.length} document{filtered.length !== 1 ? 's' : ''}
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
          data={pageDocuments}
          keyExtractor={(doc) => doc.id}
          emptyTitle="No documents found"
          emptyDescription="Try adjusting your filters, or upload a new document to get started."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageDocuments.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload documents"
        description="Files are parsed and indexed automatically after upload."
      >
        <DocumentUpload onFilesSelected={handleFilesSelected} />
      </Modal>
    </div>
  );
}
