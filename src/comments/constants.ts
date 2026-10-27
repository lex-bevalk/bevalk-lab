export const SCREEN_LABELS = [
  'Acceso',
  'Acciones',
  'Alertas',
  'Analizador',
  'Aprende',
  'Aviso',
  'Ayuda',
  'Bienvenida',
  'Bloqueo',
  'Borrar mis datos',
  'Cómo se usa BeValk',
  'Comprobar',
  'Desglose',
  'Hitos',
  'Inicio',
  'Lección',
  'MarIA',
  'Mi Familia',
  'Mi huella',
  'Mi huella · flujo',
  'Notificaciones',
  'Pasos',
  'Perfil',
  'Perfil · flujo',
  'Premium',
  'Soporte técnico',
  'SOS',
  'Subida'
] as const;

export type CommentScreen = typeof SCREEN_LABELS[number];

export const COMMENT_STATUSES = ['todo', 'in_progress', 'done', 'wont_do'] as const;
export type CommentStatus = typeof COMMENT_STATUSES[number];

export const COMMENT_STATUS_LABELS: Record<CommentStatus, string> = {
  todo: 'Por hacer',
  in_progress: 'En curso',
  done: 'Hecho',
  wont_do: 'No se hará'
};

export const COMMENT_PLAN_LABELS: Record<string, string> = {
  free: 'Freemium',
  premium: 'Premium'
};

