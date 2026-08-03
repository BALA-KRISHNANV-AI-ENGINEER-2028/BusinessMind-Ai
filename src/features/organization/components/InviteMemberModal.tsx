import { useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input, Select } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ROLE_DEFINITIONS } from '../../../constants/rbac.constants';
import type { OrgMemberRole } from '../../../types/organization';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: OrgMemberRole) => Promise<void>;
}

const roleOptions = Object.values(ROLE_DEFINITIONS).map((def) => ({
  label: `${def.label} — ${def.description}`,
  value: def.role,
}));

export function InviteMemberModal({ open, onClose, onInvite }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgMemberRole>('analyst');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await onInvite(email.trim(), role);
      setEmail('');
      setRole('analyst');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite Team Member"
      description="They will receive an email invitation to join your organization."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Select
          label="Organization Role"
          options={roleOptions}
          value={role}
          onChange={(e) => setRole(e.target.value as OrgMemberRole)}
        />

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!email.trim()}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
