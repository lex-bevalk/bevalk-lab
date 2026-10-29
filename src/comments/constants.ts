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

export const SCREEN_LABELS_BY_PROTO = {
  concept: SCREEN_LABELS,
  current: [
    'Acceso',
    'Acciones',
    'Alertas',
    'Analizador',
    'Aprende',
    'Aviso',
    'Avisos automáticos',
    'Bienvenida',
    'Bloqueo',
    'Borrar mis datos',
    'Cómo se usa BeValk',
    'Desglose',
    'Escáner',
    'Hitos',
    'Inicio',
    'MarIA',
    'Mi Familia',
    'Mi huella · flujo',
    'Mi huella',
    'Notificaciones',
    'Pasos',
    'Perfil · flujo',
    'Perfil',
    'Plan paso a paso',
    'Premium',
    'Próximamente',
    'SOS',
    'Soporte técnico',
    'Subida'
  ]
} as const;

export const PROTOS = ['current', 'concept'] as const;
export type CommentProto = typeof PROTOS[number];
export type CommentScreen = typeof SCREEN_LABELS_BY_PROTO[CommentProto][number];
export const ALL_SCREEN_LABELS = [...new Set([...SCREEN_LABELS, ...SCREEN_LABELS_BY_PROTO.current])] as readonly CommentScreen[];

export const COMMENT_PROTO_LABELS: Record<CommentProto, string> = {
  current: 'Current',
  concept: 'Concept'
};

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

