import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3 mb-5">
        {variant === 'danger' && (
          <div className="shrink-0 w-9 h-9 rounded-full bg-err/15 border border-err/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-err" />
          </div>
        )}
        <p className="text-sm text-ink-dim leading-relaxed">{message}</p>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
          disabled={loading}
        >
          {loading ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
