import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowUpRight, MessageSquarePlus, Trash2, X } from 'lucide-react';
import { COMMENT_STATUSES, COMMENT_STATUS_LABELS, type CommentStatus } from '../comments/constants';
import { deleteTokenFor, forgetDeleteToken, rememberDeleteToken } from '../comments/deleteTokens';
import NativeSelect from '../comments/NativeSelect';
import Replies, { type ReplyItem } from '../comments/Replies';
import { readStoredName, writeStoredName } from '../comments/authorName';
import { labBridge } from './bridges';

interface ReviewComment {
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

interface ReviewTarget {
  element: HTMLElement;
  label: string;
  tpl: string | null;
  left: number;
  top: number;
  width: number;
  height: number;
  hitLeft: number;
  hitTop: number;
  hitWidth: number;
  hitHeight: number;
}

interface VisibleScreen extends ReviewTarget {
  phoneLeft: number;
  phoneWidth: number;
  phoneBottom: number;
  viewportWidth: number;
  viewportHeight: number;
}

interface PendingPin {
  x: number;
  y: number;
  screen: string;
  tpl: string | null;
  flow: string | null;
  plan: string | null;
}

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

function currentLabContext(): { flow: string | null; plan: string | null } {
  return labBridge()?.current() ?? { flow: null, plan: null };
}

function isVisible(element: HTMLElement, phoneRect: DOMRect): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return style.display !== 'none'
    && style.visibility !== 'hidden'
    && Number(style.opacity) !== 0
    && rect.width > 1
    && rect.height > 1
    && rect.right > phoneRect.left
    && rect.left < phoneRect.right
    && rect.bottom > phoneRect.top
    && rect.top < phoneRect.bottom;
}

function useVisibleScreen(): VisibleScreen | null {
  const [target, setTarget] = useState<VisibleScreen | null>(null);

  useEffect(() => {
    const root = document.getElementById('root') ?? document.body;
    let resizeObserver: ResizeObserver | null = null;
    let frame = 0;

    const measure = () => {
      const phone = document.querySelector<HTMLElement>('.tp-phone');
      if (!phone) {
        setTarget(null);
        return;
      }

      const phoneRect = phone.getBoundingClientRect();
      const candidates = Array.from(phone.querySelectorAll<HTMLElement>('[data-screen-label]'))
        .filter(element => isVisible(element, phoneRect))
        .sort((left, right) => {
          const a = left.getBoundingClientRect();
          const b = right.getBoundingClientRect();
          return b.width * b.height - a.width * a.height;
        });
      const element = candidates[0];
      resizeObserver?.disconnect();
      if (!element) {
        setTarget(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      const hitLeft = Math.max(rect.left, phoneRect.left);
      const hitTop = Math.max(rect.top, phoneRect.top);
      const hitRight = Math.min(rect.right, phoneRect.right);
      const hitBottom = Math.min(rect.bottom, phoneRect.bottom);
      const next: VisibleScreen = {
        element,
        label: element.getAttribute('data-screen-label') ?? '',
        tpl: element.getAttribute('data-dc-tpl'),
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        hitLeft,
        hitTop,
        hitWidth: Math.max(0, hitRight - hitLeft),
        hitHeight: Math.max(0, hitBottom - hitTop),
        phoneLeft: phoneRect.left,
        phoneWidth: phoneRect.width,
        phoneBottom: phoneRect.bottom,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };

      setTarget(previous => {
        if (previous
          && previous.element === next.element
          && previous.label === next.label
          && previous.tpl === next.tpl
          && Math.abs(previous.left - next.left) < 0.25
          && Math.abs(previous.top - next.top) < 0.25
          && Math.abs(previous.width - next.width) < 0.25
          && Math.abs(previous.height - next.height) < 0.25
          && Math.abs(previous.phoneLeft - next.phoneLeft) < 0.25
          && Math.abs(previous.phoneWidth - next.phoneWidth) < 0.25
          && Math.abs(previous.phoneBottom - next.phoneBottom) < 0.25
          && previous.viewportWidth === next.viewportWidth
          && previous.viewportHeight === next.viewportHeight) return previous;
        return next;
      });

      resizeObserver = new ResizeObserver(schedule);
      resizeObserver.observe(phone);
      resizeObserver.observe(element);
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(root, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-screen-label', 'data-dc-tpl'],
      childList: true,
      subtree: true
    });
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    schedule();

    return () => {
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, []);

  return target;
}

function errorMessage(status: number): string {
  if (status === 401) return 'Tu sesión ha caducado. Vuelve a entrar.';
  if (status === 429) return 'Has enviado muchos comentarios seguidos. Espera unos minutos.';
  return 'No se pudo guardar el comentario. Inténtalo de nuevo.';
}

function commentHref(item: ReviewComment): string {
  const params = new URLSearchParams();
  if (item.flow) params.set('flow', item.flow);
  if (item.plan) params.set('plan', item.plan);
  params.set('c', item.id);
  const reviewPath = labBridge()?.proto === 'concept' ? '/concept/review' : '/review';
  return `${reviewPath}?${params.toString()}`;
}

function popoverPosition(item: ReviewComment, target: ReviewTarget): CSSProperties {
  const anchorX = target.left + item.x * target.width;
  const anchorY = target.top + item.y * target.height;
  const maxHeight = Math.max(160, Math.min(520, window.innerHeight - 24));
  return {
    left: Math.max(12, Math.min(anchorX + 18, window.innerWidth - 332)),
    top: Math.max(12, Math.min(anchorY + 18, window.innerHeight - maxHeight - 12)),
    maxHeight
  };
}

export default function Review() {
  const target = useVisibleScreen();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState(false);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState(readStoredName);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'team' | 'owner'>('team');
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeComment = comments.find(comment => comment.id === activeId) ?? null;
  const [statusSaving, setStatusSaving] = useState(false);
  const [popoverError, setPopoverError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [highlightId, setHighlightId] = useState(() => new URLSearchParams(window.location.search).get('c'));
  const toggleAnchored = Boolean(
    target
    && target.viewportWidth >= 1280
    && target.phoneWidth > 0
    && target.phoneBottom + 56 <= target.viewportHeight
  );

  const commentsForScreen = useMemo(
    () => target ? comments.filter(comment => comment.screen === target.label) : [],
    [comments, target]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/comments', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Comments could not be loaded.');
        return response.json() as Promise<{ role: 'team' | 'owner'; items: ReviewComment[] }>;
      })
      .then(result => {
        setRole(result.role);
        setComments(result.items.map(item => ({ ...item, replies: item.replies ?? [] })));
      })
      .catch(reason => {
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) setComments([]);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flowId = params.get('flow');
    const plan = params.get('plan');
    if (!flowId) return;
    let attempts = 0;
    let timer = 0;
    const selectFlow = () => {
      const bridge = labBridge();
      if (bridge?.select(flowId, plan === 'free' || plan === 'premium' ? plan : undefined)) return;
      attempts += 1;
      if (attempts < 30) timer = window.setTimeout(selectFlow, 50);
    };
    selectFlow();
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (dialogOpen) nameRef.current?.focus();
  }, [dialogOpen]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setError('');
    window.requestAnimationFrame(() => toggleRef.current?.focus());
  }, []);

  useEffect(() => {
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape'
        || (event.target instanceof HTMLTextAreaElement && event.target.closest('.replies__form') && event.target.value)) return;
      if (!dialogOpen && !mode && !activeId) return;
      event.preventDefault();
      event.stopPropagation();
      if (dialogOpen) closeDialog();
      else if (activeId) setActiveId(null);
      else setMode(false);
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [activeId, closeDialog, dialogOpen, mode]);

  useEffect(() => {
    if (confirmingDelete) cancelDeleteRef.current?.focus();
  }, [confirmingDelete]);

  function startComment(clientX: number, clientY: number) {
    if (!target) return;
    const within = clientX >= target.hitLeft && clientX <= target.hitLeft + target.hitWidth
      && clientY >= target.hitTop && clientY <= target.hitTop + target.hitHeight;
    if (!within) return;
    const context = currentLabContext();
    setPendingPin({
      x: Math.min(1, Math.max(0, (clientX - target.left) / target.width)),
      y: Math.min(1, Math.max(0, (clientY - target.top) / target.height)),
      screen: target.label,
      tpl: target.tpl,
      flow: context.flow,
      plan: context.plan
    });
    setBody('');
    setError('');
    setDialogOpen(true);
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingPin || sending) return;
    const cleanName = name.trim();
    const cleanBody = body.trim();
    if (!cleanName || !cleanBody) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: cleanName, body: cleanBody, ...pendingPin })
      });
      if (!response.ok) {
        setError(errorMessage(response.status));
        return;
      }
      const { delete_token, ...item } = await response.json() as ReviewComment & { delete_token: string };
      rememberDeleteToken(item.id, delete_token);
      setComments(current => [item, ...current]);
      setHighlightId(item.id);
      setPendingPin(null);
      closeDialog();
    } catch {
      setError(errorMessage(0));
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(event: ChangeEvent<HTMLSelectElement>) {
    if (!activeComment || statusSaving) return;
    const id = activeComment.id;
    const status = event.currentTarget.value as CommentStatus;
    setStatusSaving(true);
    setPopoverError('');
    try {
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (!response.ok) {
        setPopoverError('No se pudo actualizar el estado. Inténtalo de nuevo.');
        return;
      }
      const updated = await response.json() as ReviewComment;
      setComments(current => current.map(comment => comment.id === id ? { ...updated, replies: updated.replies ?? comment.replies ?? [] } : comment));
    } catch {
      setPopoverError('No se pudo actualizar el estado. Inténtalo de nuevo.');
    } finally {
      setStatusSaving(false);
    }
  }

  async function deleteActiveComment() {
    if (!activeComment || deleting) return;
    const id = activeComment.id;
    const token = deleteTokenFor(id);
    setDeleting(true);
    setPopoverError('');
    try {
      const response = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...(token ? { token } : {}) })
      });
      if (response.status !== 200 && response.status !== 404) {
        if (response.status === 429) setPopoverError('Has intentado borrar demasiados comentarios seguidos. Espera unos minutos.');
        else if (response.status === 403) setPopoverError('No tienes permiso para eliminar este comentario.');
        else setPopoverError('No se pudo eliminar este comentario. Inténtalo de nuevo.');
        return;
      }
      setComments(current => current.filter(comment => comment.id !== id));
      forgetDeleteToken(id);
      setHighlightId(current => current === id ? null : current);
      setActiveId(null);
      setConfirmingDelete(false);
      setSuccessNotice('Comentario eliminado');
      window.requestAnimationFrame(() => toggleRef.current?.focus());
    } catch {
      setPopoverError('No se pudo eliminar este comentario. Inténtalo de nuevo.');
    } finally {
      setDeleting(false);
    }
  }

  function onDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], select:not(:disabled), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <button
        ref={toggleRef}
        className={`review-toggle odin-btn odin-btn--primary${toggleAnchored ? ' review-toggle--anchored' : ''}`}
        type="button"
        aria-pressed={mode}
        style={toggleAnchored && target ? {
          left: target.phoneLeft + target.phoneWidth / 2,
          top: target.phoneBottom + 8
        } : undefined}
        onClick={() => {
          setMode(current => !current);
          setActiveId(null);
        }}
      >
        {mode ? <X aria-hidden="true" size={18} /> : <MessageSquarePlus aria-hidden="true" size={18} />}
        <span className="review-toggle__label">{mode ? 'Cancelar' : 'Comentar'}</span>
      </button>

      {mode && target && target.hitWidth > 0 && target.hitHeight > 0 && (
        <div
          className="review-target"
          data-testid="review-target"
          aria-label={`Marca una zona de ${target.label}`}
          role="button"
          tabIndex={0}
          onClick={event => startComment(event.clientX, event.clientY)}
          onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            startComment(target.hitLeft + target.hitWidth / 2, target.hitTop + target.hitHeight / 2);
          }}
          style={{
            left: target.hitLeft,
            top: target.hitTop,
            width: target.hitWidth,
            height: target.hitHeight
          }}
        />
      )}

      {target && commentsForScreen.length > 0 && (
        <div className="review-pins" role="group" aria-label={`Comentarios en ${target.label}`}>
          {commentsForScreen.map((comment, index) => (
            <button
              className={`review-pin review-pin--${comment.status}${comment.id === highlightId ? ' review-pin--highlight' : ''}`}
              key={comment.id}
              type="button"
              aria-label={`Comentario ${index + 1} en ${target.label}: ${comment.author}`}
              aria-pressed={activeId === comment.id}
              data-testid="review-pin"
              style={{ left: target.left + comment.x * target.width, top: target.top + comment.y * target.height }}
              onClick={() => {
                setActiveId(comment.id);
                setPopoverError('');
                setConfirmingDelete(false);
                setHighlightId(comment.id);
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {activeComment && target && (
        <aside className="review-popover odin-popover" aria-label={`Comentario de ${activeComment.author}`} style={popoverPosition(activeComment, target)}>
          <button className="review-popover__close" type="button" aria-label="Cerrar comentario" onClick={() => setActiveId(null)}>
            <X aria-hidden="true" size={16} />
          </button>
          <p className="review-popover__author">{activeComment.author}</p>
          <time className="review-popover__date" dateTime={activeComment.created_at}>{dateFormatter.format(new Date(activeComment.created_at))}</time>
          <p className="review-popover__body">{activeComment.body}</p>
          <div className="review-popover__state">
            {role === 'owner' ? (
              <NativeSelect
                aria-label={`Estado de ${activeComment.author}`}
                className={`review-popover__status review-popover__status--${activeComment.status}`}
                wrapperClassName="review-popover__status-control"
                disabled={statusSaving}
                value={activeComment.status}
                onChange={changeStatus}
              >
                {COMMENT_STATUSES.map(status => <option key={status} value={status}>{COMMENT_STATUS_LABELS[status]}</option>)}
              </NativeSelect>
            ) : <StatusLine status={activeComment.status} />}
          </div>
          {popoverError && <p className="review-popover__error" role="alert">{popoverError}</p>}
          <Replies
            key={activeComment.id}
            commentId={activeComment.id}
            replies={activeComment.replies ?? []}
            onReplied={reply => setComments(current => current.map(comment => comment.id === reply.comment_id
              ? { ...comment, replies: [...(comment.replies ?? []), reply] }
              : comment))}
          />
          <div className="review-popover__actions">
            {role === 'owner' || deleteTokenFor(activeComment.id) ? (
              confirmingDelete ? (
                <div className="review-popover__delete-confirmation">
                  <p>¿Eliminar este comentario?</p>
                  <button className="odin-btn odin-btn--destructive odin-btn--sm" type="button" disabled={deleting} onClick={deleteActiveComment}>Sí, eliminar</button>
                  <button
                    ref={cancelDeleteRef}
                    className="odin-btn odin-btn--outline odin-btn--sm"
                    type="button"
                    disabled={deleting}
                    onClick={() => {
                      setConfirmingDelete(false);
                      window.requestAnimationFrame(() => deleteButtonRef.current?.focus());
                    }}
                  >No</button>
                </div>
              ) : (
                <button
                  ref={deleteButtonRef}
                  className="odin-btn odin-btn--outline odin-btn--sm"
                  type="button"
                  onClick={() => {
                    setPopoverError('');
                    setSuccessNotice('');
                    setConfirmingDelete(true);
                  }}
                >
                  <Trash2 aria-hidden="true" size={16} />
                  Eliminar
                </button>
              )
            ) : <span />}
            <a className="odin-btn odin-btn--outline odin-btn--sm review-popover__all" href={commentHref(activeComment)}>
              Ver todos <ArrowUpRight aria-hidden="true" size={15} />
            </a>
          </div>
        </aside>
      )}

      <span className="review-sr-only" role="status">{successNotice}</span>

      {dialogOpen && (
        <div className="review-modal-layer">
          <div className="review-scrim" aria-hidden="true" />
          <div
            ref={dialogRef}
            className="odin-dialog review-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
            aria-describedby="review-dialog-desc"
            onKeyDown={onDialogKeyDown}
          >
            <header className="review-dialog__header">
              <div>
                <h2 className="odin-dialog__title" id="review-dialog-title">Nuevo comentario</h2>
                <p className="odin-dialog__desc" id="review-dialog-desc">En {pendingPin?.screen}. Tu comentario quedará marcado en esta zona.</p>
              </div>
              <button className="review-dialog__close" type="button" aria-label="Cancelar" onClick={closeDialog}>
                <X aria-hidden="true" size={20} />
              </button>
            </header>
            <form className="review-form" onSubmit={submitComment}>
              <label className="odin-field">
                <span className="odin-label">Tu nombre</span>
                <input
                  ref={nameRef}
                  className="odin-input review-input"
                  name="author"
                  type="text"
                  autoComplete="name"
                  maxLength={60}
                  required
                  value={name}
                  onChange={event => {
                    setName(event.currentTarget.value);
                    writeStoredName(event.currentTarget.value);
                  }}
                />
              </label>
              <label className="odin-field">
                <span className="odin-label">Comentario</span>
                <textarea
                  className="odin-textarea"
                  name="body"
                  maxLength={2000}
                  required
                  value={body}
                  onChange={event => setBody(event.currentTarget.value)}
                />
              </label>
              {error && <p className="review-error" role="alert">{error}</p>}
              <footer className="odin-dialog__foot review-dialog__foot">
                <button className="odin-btn odin-btn--outline" type="button" onClick={closeDialog}>Cancelar</button>
                <button className="odin-btn odin-btn--primary" type="submit" disabled={sending || !name.trim() || !body.trim()}>
                  {sending ? 'Enviando…' : 'Enviar'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function StatusLine({ status }: { status: CommentStatus }) {
  return <span className={`review-popover__status review-popover__status--${status}`}>{COMMENT_STATUS_LABELS[status]}</span>;
}
