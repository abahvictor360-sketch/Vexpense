import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Save, UserPlus, Power, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import clsx from 'clsx';
import { adminApi } from '../api';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import type { PlatformSettings, AdminUser, AuditLogEntry } from '../types';

type Tab = 'platform' | 'admins' | 'audit';

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('platform');
  const { admin } = useAuth();

  return (
    <div className="space-y-6">
      <div className="border-b border-line flex gap-1">
        {([
          { k: 'platform', label: 'Platform' },
          { k: 'admins', label: 'Admins' },
          { k: 'audit', label: 'Audit Log' },
        ] as { k: Tab; label: string }[]).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={clsx(
              'px-4 py-2 text-sm border-b-2 -mb-px transition-colors',
              tab === t.k
                ? 'text-ink border-accent'
                : 'text-ink-muted border-transparent hover:text-ink'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'platform' && <PlatformTab readOnly={admin?.role !== 'super_admin'} />}
      {tab === 'admins' && <AdminsTab readOnly={admin?.role !== 'super_admin'} />}
      {tab === 'audit' && <AuditTab />}
    </div>
  );
}

function PlatformTab({ readOnly }: { readOnly: boolean }) {
  const [s, setS] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi
      .settings()
      .then((r) => setS(r.settings))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load settings'));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!s) return;
    setSaving(true);
    try {
      const r = await adminApi.updateSettings(s);
      setS(r.settings);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (!s) return <div className="text-sm text-ink-muted">Loading…</div>;

  return (
    <form onSubmit={save} className="card p-5 max-w-2xl space-y-4">
      {readOnly && (
        <div className="text-xs text-warn flex items-center gap-2">
          <Shield className="w-4 h-4" /> Super admin role required to edit settings.
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Maintenance mode</div>
          <div className="text-xs text-ink-muted">Blocks non-admin API access</div>
        </div>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={s.maintenance_mode}
            disabled={readOnly}
            onChange={(e) => setS({ ...s, maintenance_mode: e.target.checked })}
            className="accent-accent w-4 h-4"
          />
        </label>
      </div>
      <div>
        <label className="label block mb-1.5">Default currency</label>
        <input
          value={s.default_currency}
          disabled={readOnly}
          onChange={(e) => setS({ ...s, default_currency: e.target.value })}
          className="input max-w-[200px]"
        />
      </div>
      <div>
        <label className="label block mb-1.5">AI rate limit (req/hr/user)</label>
        <input
          type="number"
          value={s.ai_rate_limit}
          disabled={readOnly}
          onChange={(e) => setS({ ...s, ai_rate_limit: parseInt(e.target.value, 10) || 0 })}
          className="input max-w-[200px]"
        />
      </div>
      <div>
        <label className="label block mb-1.5">Flag threshold (₦)</label>
        <input
          type="number"
          value={s.flag_threshold}
          disabled={readOnly}
          onChange={(e) => setS({ ...s, flag_threshold: parseInt(e.target.value, 10) || 0 })}
          className="input max-w-[200px]"
        />
      </div>
      <div>
        <button className="btn-primary" type="submit" disabled={saving || readOnly}>
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function AdminsTab({ readOnly }: { readOnly: boolean }) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'moderator' });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminApi.admins();
      setAdmins(r.admins);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(a: AdminUser) {
    try {
      const r = await adminApi.toggleAdminStatus(a.id);
      setAdmins((prev) => prev.map((x) => (x.id === a.id ? r.admin : x)));
      toast.success(r.admin.is_active ? 'Activated' : 'Deactivated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle');
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await adminApi.createAdmin(form);
      toast.success('Admin created');
      setOpenCreate(false);
      setForm({ name: '', email: '', password: '', role: 'moderator' });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  const columns = useMemo<Column<AdminUser>[]>(
    () => [
      { key: 'name', header: 'Name', sortable: true },
      { key: 'email', header: 'Email', sortable: true },
      {
        key: 'role',
        header: 'Role',
        render: (a) => (
          <Badge variant={a.role === 'super_admin' ? 'accent' : 'info'}>
            {a.role.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        key: 'is_active',
        header: 'Status',
        render: (a) =>
          a.is_active ? <Badge variant="success">active</Badge> : <Badge variant="danger">disabled</Badge>,
      },
      {
        key: 'last_login',
        header: 'Last login',
        render: (a) =>
          a.last_login ? (
            <span className="text-xs text-ink-dim">{format(new Date(a.last_login), 'MMM d, HH:mm')}</span>
          ) : (
            <span className="text-ink-muted text-xs">never</span>
          ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (a) => (
          <button onClick={() => toggle(a)} disabled={readOnly} className="btn-ghost p-1.5" title="Toggle status">
            <Power className="w-4 h-4" />
          </button>
        ),
      },
    ],
    [readOnly]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Admin users</h3>
        <button
          className="btn-primary"
          disabled={readOnly}
          onClick={() => setOpenCreate(true)}
          title={readOnly ? 'Super admin required' : 'Create admin'}
        >
          <UserPlus className="w-4 h-4" /> New admin
        </button>
      </div>
      <DataTable columns={columns} rows={admins} loading={loading} emptyLabel="No admins yet." />

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create admin">
        <form onSubmit={create} className="space-y-3">
          <div>
            <label className="label block mb-1.5">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label block mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label block mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="label block mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input"
            >
              <option value="moderator">Moderator</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpenCreate(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function AuditTab() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminApi.auditLog({ page, limit: 50 });
      setEntries(r.entries);
      setPages(r.pages);
      setTotal(r.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo<Column<AuditLogEntry>[]>(
    () => [
      {
        key: 'created_at',
        header: 'Time',
        sortable: true,
        render: (e) => (
          <span className="text-ink-dim text-xs">{format(new Date(e.created_at), 'MMM d, HH:mm:ss')}</span>
        ),
      },
      { key: 'admin_email', header: 'Admin', render: (e) => e.admin_email ?? '—' },
      { key: 'action', header: 'Action', render: (e) => <Badge variant="info">{e.action}</Badge> },
      { key: 'target_type', header: 'Target type' },
      {
        key: 'target_id',
        header: 'Target ID',
        render: (e) => (e.target_id ? <code className="text-xs">{String(e.target_id).slice(0, 16)}</code> : '—'),
      },
      {
        key: 'details',
        header: 'Details',
        render: (e) => (
          <code className="text-xs text-ink-muted truncate max-w-[280px] inline-block">
            {e.details ? JSON.stringify(e.details) : '—'}
          </code>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <DataTable columns={columns} rows={entries} loading={loading} emptyLabel="No audit entries." />
      <Pagination page={page} pages={pages} total={total} onChange={setPage} />
    </div>
  );
}
