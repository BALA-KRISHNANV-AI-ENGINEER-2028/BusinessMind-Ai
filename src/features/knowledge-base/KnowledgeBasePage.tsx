import { useState } from 'react';
import { Search, BookOpen, Plus, FolderPlus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { knowledgeBaseService } from '../../services/knowledgeBase.service';
import { QUERY_KEYS } from '../../constants';

export function KnowledgeBasePage() {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const debouncedSearch = useDebounce(search, 300);

  const { data: kbRes, refetch } = useQuery({
    queryKey: [QUERY_KEYS.KNOWLEDGE_BASE, debouncedSearch],
    queryFn: () => knowledgeBaseService.getKnowledgeBases(debouncedSearch),
  });

  const knowledgeBases = kbRes?.success ? kbRes.data : [];

  async function handleCreateKB(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await knowledgeBaseService.createKnowledgeBase({ name, description });
      showToast({
        title: 'Knowledge Base Created',
        description: `'${name}' has been created successfully.`,
        variant: 'success',
      });
      setName('');
      setDescription('');
      setCreateOpen(false);
      refetch();
    } catch (err) {
      showToast({
        title: 'Creation Failed',
        description: err instanceof Error ? err.message : 'Failed to create knowledge base',
        variant: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteKB(id: string, kbName: string) {
    if (!confirm(`Are you sure you want to delete '${kbName}'?`)) return;
    try {
      await knowledgeBaseService.deleteKnowledgeBase(id);
      showToast({
        title: 'Knowledge Base Deleted',
        description: `'${kbName}' has been removed.`,
        variant: 'success',
      });
      refetch();
    } catch (err) {
      showToast({
        title: 'Delete Failed',
        description: err instanceof Error ? err.message : 'Failed to delete knowledge base',
        variant: 'danger',
      });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Knowledge Base"
        description="Logical business knowledge collections organizing source documents."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            New Knowledge Base
          </Button>
        }
      />

      <div className="max-w-xs">
        <Input
          placeholder="Search knowledge bases..."
          leadingIcon={<Search size={16} />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {knowledgeBases.length === 0 ? (
        <EmptyState
          title="No knowledge bases found"
          description="Create a knowledge base to organize your enterprise documents."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <FolderPlus size={16} />
              Create Knowledge Base
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {knowledgeBases.map((kb) => (
            <Card key={kb.id} className="transition-colors duration-150 hover:border-border-strong relative group">
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-9 items-center justify-center rounded-md bg-accent-subtle text-accent-text">
                    <BookOpen size={18} aria-hidden="true" />
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteKB(kb.id, kb.name)}
                      className="p-1 rounded text-text-secondary hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete Knowledge Base"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{kb.name}</p>
                    {kb.isDefault && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-accent-subtle text-accent-text rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                    {kb.description || 'No description provided.'}
                  </p>
                </div>
                <p className="text-xs font-medium text-text-secondary">
                  {kb.documentCount} document{kb.documentCount !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Knowledge Base"
        description="Group business documents into a logical enterprise knowledge collection."
      >
        <form onSubmit={handleCreateKB} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Knowledge Base Name *
            </label>
            <Input
              placeholder="e.g. Finance & Q3 Reports"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe the scope or purpose of this knowledge collection..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-surface p-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
