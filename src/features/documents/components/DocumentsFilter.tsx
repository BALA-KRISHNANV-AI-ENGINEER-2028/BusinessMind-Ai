import { Search } from 'lucide-react';
import { Input, Select } from '../../../components/ui/Input';

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Processed', value: 'processed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Failed', value: 'failed' },
];

const categoryOptions = [
  { label: 'All categories', value: 'all' },
  { label: 'Legal', value: 'Legal' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Market Research', value: 'Market Research' },
  { label: 'Engineering', value: 'Engineering' },
  { label: 'Competitive Intelligence', value: 'Competitive Intelligence' },
  { label: 'Security', value: 'Security' },
  { label: 'Operations', value: 'Operations' },
  { label: 'Product', value: 'Product' },
];

interface DocumentsFilterProps {
  search: string;
  status: string;
  category: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export function DocumentsFilter({
  search,
  status,
  category,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
}: DocumentsFilterProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="min-w-48 flex-1">
        <Input
          placeholder="Search documents..."
          leadingIcon={<Search size={16} />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search documents"
        />
      </div>
      <div className="w-44">
        <Select
          options={statusOptions}
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter by status"
        />
      </div>
      <div className="w-52">
        <Select
          options={categoryOptions}
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Filter by category"
        />
      </div>
    </div>
  );
}
