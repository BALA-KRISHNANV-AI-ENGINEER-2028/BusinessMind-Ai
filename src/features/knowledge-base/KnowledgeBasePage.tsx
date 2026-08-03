import { useMemo, useState } from 'react';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../hooks/useToast';
import { knowledgeCategories } from '../../mocks/knowledgeBase.mock';

export function KnowledgeBasePage() {
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  const filtered = useMemo(
    () => knowledgeCategories.filter((category) => category.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Knowledge Base" description="Browse documents organized by category." />

      <div className="max-w-xs">
        <Input
          placeholder="Search categories..."
          leadingIcon={<Search size={16} />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No categories found" description="Try a different search term." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                showToast({
                  title: category.name,
                  description: 'Category drill-down will be wired up once documents are backed by real data.',
                  variant: 'info',
                })
              }
              className="w-full rounded-lg text-left"
            >
              <Card className="transition-colors duration-150 hover:border-border-strong">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-9 items-center justify-center rounded-md bg-accent-subtle text-accent-text">
                      <BookOpen size={18} aria-hidden="true" />
                    </span>
                    <ChevronRight size={16} className="mt-1 text-text-secondary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{category.name}</p>
                    <p className="mt-1 text-sm text-text-secondary">{category.description}</p>
                  </div>
                  <p className="text-xs font-medium text-text-secondary">{category.documentCount} documents</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
