import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { useOrganization } from '../../hooks/useOrganization';
import { useToast } from '../../hooks/useToast';

export function OrganizationSwitcher() {
  const { activeOrganization, organizations, switchOrganization } = useOrganization();
  const { showToast } = useToast();

  if (!activeOrganization) return null;

  const dropdownItems = organizations.map((org) => ({
    label: org.name,
    icon: (
      <div className="flex items-center justify-between w-full">
        <span className="truncate">{org.name}</span>
        {org.id === activeOrganization.id && <Check size={14} className="ml-2 text-accent-text" />}
      </div>
    ),
    onSelect: () => {
      if (org.id !== activeOrganization.id) {
        switchOrganization(org.id);
        showToast({
          title: `Switched to ${org.name}`,
          description: `Active tenant is now set to ${org.name}.`,
          variant: 'info',
        });
      }
    },
  }));

  return (
    <Dropdown
      triggerLabel="Switch organization"
      align="left"
      trigger={
        <div className="flex items-center gap-2 rounded-md border border-border bg-bg-subtle px-2.5 py-1.5 text-xs text-text-primary transition-colors hover:border-border-strong">
          <div className="flex size-5 items-center justify-center rounded bg-accent-subtle text-accent-text font-bold">
            <Building2 size={12} aria-hidden="true" />
          </div>
          <span className="max-w-28 truncate font-medium sm:max-w-36">{activeOrganization.name}</span>
          <ChevronsUpDown size={14} className="text-text-disabled" aria-hidden="true" />
        </div>
      }
      items={dropdownItems}
    />
  );
}
