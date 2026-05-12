import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Download, Trash2, Ban, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { adminApi } from '../api';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Drawer } from '../components/ui/Drawer';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Badge } from '../components/ui/Badge';
import type { User, UserDetail } from '../types';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<User | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminApi.users({ search: debouncedSearch, page, limit: 25 });
      setUsers(r.users);
      setPage(r.page);
      setPages(r.pages);
      setTotal(r.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function openUser(u: User) {
    setSelected(u);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await adminApi.user(u.id);
      setDetail(d);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateStatus(u: User, status: string) {
    try {
      await adminApi.updateUserStatus(u.id, status);
      toast.success(`User ${status}`);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status } : x)));
      if (selected?.id === u.id) setSelected({ ...selected, status });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(confirmDelete.id);
      toast.success('User deleted');
      setConfirmDelete(null);
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  }

  async function exportUsers() {
    try {
      const r = await adminApi.exportUsers();
      const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${r.users.length} users`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export users');
    }
  }

  const columns = useMemo<Column<User>[]>(
    () => [
      {
        key: 'full_name',
        header: 'Name',
        sortable: true,
        render: (u) => (
          <div>
            <div className="text-ink">{u.full_name ?? '—'}</div>
            <div className="text-xs text-ink-muted">{u.email ?? '—'}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (u) => {
          const status = u.status ?? 'active';
          const variant =
            status === 'active' ? 'success' : status === 'suspended' ? 'warning' : 'danger';
          return <Badge variant={variant}>{status}</Badge>;
        },
      },
      {
        key: 'created_at',
        header: 'Joined',
        sortable: true,
        render: (u) =>
          u.created_at ? (
            <span className="text-ink-dim text-xs">
              {format(new Date(u.created_at), 'MMM d, yyyy')}
            </span>
          ) : (
            '—'
          ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (u) => (
          <div className="inline-flex items-center gap-1">
            <button
              className="btn-ghost p-1.5"
              onClick={(e) => {
                e.stopPropagation();
                updateStatus(u, u.status === 'active' ? 'suspended' : 'active');
              }}
              title={u.status === 'active' ? 'Suspend' : 'Reactivate'}
            >
              {u.status === 'active' ? (
                <Ban className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-ok" />
              )}
            </button>
            <button
              className="btn-ghost p-1.5 hover:text-err"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(u);
              }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email"
            className="input pl-9"
          />
        </div>
        <button className="btn-secondary" onClick={exportUsers}>
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        onRowClick={openUser}
        emptyLabel="No users found."
      />

      <Pagination page={page} pages={pages} total={total} onChange={setPage} />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.full_name ?? selected?.email ?? 'User'}
      >
        {detailLoading && <div className="text-sm text-ink-muted">Loading…</div>}
        {detail && (
          <div className="space-y-4">
            <Field label="Name" value={detail.user.full_name ?? '—'} />
            <Field label="Email" value={detail.user.email ?? '—'} />
            <Field label="Status" value={detail.user.status ?? 'active'} />
            <Field label="User ID" value={detail.user.id} mono />
            <Field
              label="Joined"
              value={
                detail.user.created_at
                  ? format(new Date(detail.user.created_at), 'PPpp')
                  : '—'
              }
            />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="card p-4">
                <div className="label">Expenses</div>
                <div className="text-2xl font-semibold mt-1">{detail.expenseCount}</div>
              </div>
              <div className="card p-4">
                <div className="label">Goals</div>
                <div className="text-2xl font-semibold mt-1">{detail.goalCount}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-3">
              <button
                className="btn-secondary"
                onClick={() =>
                  updateStatus(detail.user, detail.user.status === 'active' ? 'suspended' : 'active')
                }
              >
                {detail.user.status === 'active' ? 'Suspend' : 'Reactivate'}
              </button>
              <button className="btn-danger" onClick={() => setConfirmDelete(detail.user)}>
                <Trash2 className="w-4 h-4" /> Delete user
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        variant="danger"
        title="Delete user"
        message={`Permanently delete ${confirmDelete?.email ?? 'this user'}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="label mb-1">{label}</div>
      <div className={mono ? 'font-mono text-xs break-all text-ink-dim' : 'text-sm text-ink'}>
        {value}
      </div>
    </div>
  );
}
