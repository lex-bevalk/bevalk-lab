import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ArrowUpRight, Trash2 } from 'lucide-react';
import {
  COMMENT_STATUSES,
  COMMENT_STATUS_LABELS,
  COMMENT_PLAN_LABELS,
  SCREEN_LABELS,
  type CommentStatus
} from '../comments/constants';
import { deleteTokenFor, forgetDeleteToken } from '../comments/deleteTokens';
import NativeSelect from '../comments/NativeSelect';
import Replies, { type ReplyItem } from '../comments/Replies';

interface CommentItem {
  id: string;
  created_at: string;
  updated_at: string;
  author: string;
  body: string;
  screen: string;
  tpl: string | null;
  x: number;
  y: number;
  flow: string | null;
  plan: string | null;
  status: CommentStatus;
  replies: ReplyItem[];
}

interface CommentsResponse {
  role: 'team' | 'owner';
  items: CommentItem[];
}

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

function reviewHref(item: CommentItem): string {
  const params = new URLSearchParams();
  if (item.flow) params.set('flow', item.flow);
  if (item.plan) params.set('plan', item.plan);
  params.set('c', item.id);
  return `/review?${params.toString()}`;
}

function CommentsHeader() {
  return (
    <header className="team-header">
      <a className="team-brand" href="/" aria-label="BeValk Product Experience Lab, inicio">
        <img src="/assets/77effca3e02e95da2e7019fa1e4a6fea.png" alt="BeValk" />
        <span>Product Experience Lab</span>
      </a>
      <nav className="comments-nav" aria-label="Secciones del Lab">
        <a href="/changelog">Versiones</a>
        <a href="/comments" aria-current="page">Comentarios</a>
      </nav>
    </header>
  );
}

function StatusBadge({ status }: { status: CommentStatus }) {
  return <span className={`comments-status comments-status--${status}`}>{COMMENT_STATUS_LABELS[status]}</span>;
}

function CommentCard({
  item,
  owner,
  canDelete,
  onStatusChange,
  onDelete,
  onReplied
}: {
  item: CommentItem;
  owner: boolean;
  canDelete: boolean;
  onStatusChange: (id: string, status: CommentStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReplied: (commentId: string, reply: ReplyItem) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirmingDelete) cancelDeleteRef.current?.focus();
  }, [confirmingDelete]);

  async function changeStatus(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.currentTarget.value as CommentStatus;
    setSaving(true);
    setError('');
    try {
      await onStatusChange(item.id, next);
    } catch {
      setError('No se pudo actualizar el estado. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="comments-card" data-comment-id={item.id}>
      <header className="comments-card__header">
        <div className="comments-card__author">
          <h2>{item.author}</h2>
          <time dateTime={item.created_at}>{dateFormatter.format(new Date(item.created_at))}</time>
        </div>
        <div className="comments-card__state">
          {owner ? (
            <label className="comments-status-control">
              <span>Estado</span>
              <NativeSelect
                aria-label={`Estado de ${item.author}`}
                disabled={saving}
                onChange={changeStatus}
                value={item.status}
              >
                {COMMENT_STATUSES.map(status => <option key={status} value={status}>{COMMENT_STATUS_LABELS[status]}</option>)}
              </NativeSelect>
            </label>
          ) : <StatusBadge status={item.status} />}
        </div>
      </header>
      <dl className="comments-card__meta">
        <div><dt>Pantalla</dt><dd>{item.screen}</dd></div>
        <div><dt>Flujo</dt><dd>{item.flow || '—'}</dd></div>
        <div><dt>Plan</dt><dd>{item.plan ? COMMENT_PLAN_LABELS[item.plan] ?? item.plan : '—'}</dd></div>
      </dl>
      <p className="comments-card__body">{item.body}</p>
      <Replies
        commentId={item.id}
        replies={item.replies ?? []}
        onReplied={reply => onReplied(item.id, reply)}
      />
      {error && <p className="comments-card__error" role="alert">{error}</p>}
      <footer className="comments-card__footer">
        {confirmingDelete ? (
          <div className="comments-card__delete-confirmation">
            <p>¿Eliminar este comentario?</p>
            <button
              className="odin-btn odin-btn--destructive odin-btn--sm"
              type="button"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                setError('');
                try {
                  await onDelete(item.id);
                } catch (reason) {
                  setError(reason instanceof Error ? reason.message : 'No se pudo eliminar este comentario. Inténtalo de nuevo.');
                  setDeleting(false);
                }
              }}
            >
              Sí, eliminar
            </button>
            <button
              ref={cancelDeleteRef}
              className="odin-btn odin-btn--outline odin-btn--sm"
              type="button"
              disabled={deleting}
              onClick={() => {
                setConfirmingDelete(false);
                window.requestAnimationFrame(() => deleteButtonRef.current?.focus());
              }}
            >
              No
            </button>
          </div>
        ) : canDelete ? (
          <button
            ref={deleteButtonRef}
            className="odin-btn odin-btn--outline odin-btn--sm"
            type="button"
            onClick={() => {
              setError('');
              setConfirmingDelete(true);
            }}
          >
            <Trash2 aria-hidden="true" size={16} />
            Eliminar
          </button>
        ) : null}
        <a className="odin-btn odin-btn--outline odin-btn--sm" href={reviewHref(item)}>
          Ir <ArrowUpRight aria-hidden="true" size={16} />
        </a>
      </footer>
    </article>
  );
}

export default function CommentsPage() {
  const [screen, setScreen] = useState('');
  const [status, setStatus] = useState('');
  const [author, setAuthor] = useState('');
  const [items, setItems] = useState<CommentItem[]>([]);
  const [role, setRole] = useState<'team' | 'owner'>('team');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const noticeRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (successNotice) noticeRef.current?.focus();
  }, [successNotice]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (screen) params.set('screen', screen);
    if (status) params.set('status', status);
    if (author.trim()) params.set('author', author.trim());
    setLoading(true);
    setError('');

    fetch(`/api/comments${params.size ? `?${params.toString()}` : ''}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('No se pudo cargar la lista.');
        return response.json() as Promise<CommentsResponse>;
      })
      .then(result => {
        setRole(result.role);
        setItems(result.items.map(item => ({ ...item, replies: item.replies ?? [] })));
      })
      .catch(reason => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setError('No se han podido cargar los comentarios. Vuelve a intentarlo.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [screen, status, author]);

  async function updateStatus(id: string, nextStatus: CommentStatus) {
    const response = await fetch('/api/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: nextStatus })
    });
    if (!response.ok) throw new Error('Status update failed.');
    const result = await response.json() as CommentItem;
    setItems(current => current.map(item => item.id === id ? result : item));
  }

  function onReplied(commentId: string, reply: ReplyItem) {
    setItems(current => current.map(item => item.id === commentId
      ? { ...item, replies: [...(item.replies ?? []), reply] }
      : item));
  }

  async function deleteComment(id: string) {
    setSuccessNotice('');
    const token = deleteTokenFor(id);
    const response = await fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...(token ? { token } : {}) })
    });
    if (response.status !== 200 && response.status !== 404) {
      if (response.status === 429) throw new Error('Has intentado borrar demasiados comentarios seguidos. Espera unos minutos.');
      if (response.status === 403) throw new Error('No tienes permiso para eliminar este comentario.');
      throw new Error('No se pudo eliminar este comentario. Inténtalo de nuevo.');
    }
    setItems(current => current.filter(item => item.id !== id));
    forgetDeleteToken(id);
    setSuccessNotice('Comentario eliminado');
  }

  return (
    <>
      <CommentsHeader />
      <main className="comments-main">
        <div className="comments-intro">
          <h1>Comentarios</h1>
          <p>Notas del equipo sobre el prototipo.</p>
        </div>
        <section className="comments-filters" aria-label="Filtrar comentarios">
          <label>
            <span>Pantalla</span>
              <NativeSelect value={screen} onChange={event => setScreen(event.currentTarget.value)}>
              <option value="">Todas</option>
              {SCREEN_LABELS.map(label => <option key={label} value={label}>{label}</option>)}
              </NativeSelect>
          </label>
          <label>
            <span>Estado</span>
              <NativeSelect value={status} onChange={event => setStatus(event.currentTarget.value)}>
              <option value="">Todos</option>
              {COMMENT_STATUSES.map(value => <option key={value} value={value}>{COMMENT_STATUS_LABELS[value]}</option>)}
              </NativeSelect>
          </label>
          <label>
            <span>Autor</span>
            <input className="odin-input" type="search" value={author} onChange={event => setAuthor(event.currentTarget.value)} placeholder="Filtrar por autor" />
          </label>
        </section>
        {error && <p className="comments-notice" role="alert">{error}</p>}
        {successNotice && <p ref={noticeRef} className="comments-notice" role="status" tabIndex={-1}>{successNotice}</p>}
        {loading ? (
          <p className="comments-notice" role="status">Cargando comentarios…</p>
        ) : error ? null : items.length === 0 ? (
          <p className="comments-notice">No hay comentarios que coincidan con estos filtros.</p>
        ) : (
          <div className="comments-list">
            {items.map(item => (
              <CommentCard
                key={item.id}
                item={item}
                owner={role === 'owner'}
                canDelete={role === 'owner' || Boolean(deleteTokenFor(item.id))}
                onStatusChange={updateStatus}
                onDelete={deleteComment}
                onReplied={onReplied}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
