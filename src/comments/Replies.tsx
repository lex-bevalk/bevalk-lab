import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { readStoredName, writeStoredName } from './authorName';
import './replies.css';

export interface ReplyItem {
  id: string;
  comment_id: string;
  created_at: string;
  author: string;
  body: string;
}

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

function errorMessage(status: number): string {
  if (status === 401) return 'Tu sesión ha caducado. Vuelve a entrar.';
  if (status === 429) return 'Has enviado muchos comentarios seguidos. Espera unos minutos.';
  if (status === 404) return 'Este comentario ya no existe';
  return 'No se pudo guardar el comentario. Inténtalo de nuevo.';
}

export default function Replies({
  commentId,
  replies,
  onReplied
}: {
  commentId: string;
  replies: ReplyItem[];
  onReplied: (reply: ReplyItem) => void;
}) {
  const [author, setAuthor] = useState(readStoredName);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const authorInputRef = useRef<HTMLInputElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || !author.trim() || !body.trim()) return;
    setSending(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, author: author.trim(), body: body.trim() })
      });
      if (!response.ok) {
        setError(errorMessage(response.status));
        return;
      }
      const reply = await response.json() as ReplyItem;
      onReplied(reply);
      setBody('');
      setNotice('Respuesta enviada');
      if (detailsRef.current) detailsRef.current.open = false;
      window.requestAnimationFrame(() => summaryRef.current?.focus());
    } catch {
      setError(errorMessage(0));
    } finally {
      setSending(false);
    }
  }

  function onBodyKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape' && body) event.stopPropagation();
  }

  return (
    <section className="replies">
      {replies.length > 0 && (
        <ul className="replies__list" aria-label="Respuestas">
          {replies.map(reply => (
            <li className="replies__item" key={reply.id}>
              <div className="replies__meta">
                <strong>{reply.author}</strong>
                <time dateTime={reply.created_at}>{dateFormatter.format(new Date(reply.created_at))}</time>
              </div>
              <p className="replies__body">{reply.body}</p>
            </li>
          ))}
        </ul>
      )}
      <details
        ref={detailsRef}
        className="replies__form"
        onToggle={event => {
          if (event.currentTarget.open) {
            (author.trim() ? replyTextareaRef.current : authorInputRef.current)?.focus();
          }
        }}
      >
        <summary ref={summaryRef}>Responder</summary>
        <form onSubmit={submitReply}>
          <label className="odin-field">
            <span className="odin-label">Tu nombre</span>
            <input
              ref={authorInputRef}
              className="odin-input replies__input"
              name="author"
              type="text"
              autoComplete="name"
              maxLength={60}
              required
              value={author}
              onChange={event => {
                setAuthor(event.currentTarget.value);
                writeStoredName(event.currentTarget.value);
              }}
            />
          </label>
          <label className="odin-field">
            <span className="odin-label">Respuesta</span>
            <textarea
              ref={replyTextareaRef}
              className="odin-textarea replies__textarea"
              name="body"
              maxLength={2000}
              required
              value={body}
              onChange={event => setBody(event.currentTarget.value)}
              onKeyDown={onBodyKeyDown}
            />
          </label>
          {error && <p className="replies__error" role="alert">{error}</p>}
          <button className="odin-btn odin-btn--primary odin-btn--sm" type="submit" disabled={sending || !author.trim() || !body.trim()}>
            {sending ? 'Enviando…' : 'Responder'}
          </button>
        </form>
      </details>
      <span className="replies__status" role="status">{notice}</span>
    </section>
  );
}
