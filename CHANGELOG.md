# Changelog

Cambios relevantes del BeValk Product Experience Lab. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versiones según [SemVer](https://semver.org/lang/es/).

## [Unreleased]

## [1.4.0] - 2026-10-27

### Added
- Borrar comentarios: el autor los suyos desde su navegador y el owner cualquiera.

### Changed
- El botón Comentar está bajo el móvil del prototipo.

### Fixed
- Los selectores de `/comments` muestran el chevron con su margen.

## [1.3.0] - 2026-10-27

### Added
- Comentarios con marcas en `/review` y gestión de estados en `/comments`.

## [1.2.1] - 2026-10-27

### Fixed
- El botón "Eliminar cuenta" usa el rojo de Odin y cumple el contraste AA.

## [1.2.0] - 2026-10-27

### Changed
- Los selectores de Seguridad, Eliminar cuenta, Tu opinión importa, Soporte técnico y Revisión de tu caso abren un desplegable en lugar de un panel inferior, y se manejan con teclado.

## [1.1.0] - 2026-10-27

### Added
- Acceso con contraseña: pantalla de entrada propia de BeValk. El enlace ya no pide una cuenta de Vercel.
- Página de versiones en `/changelog`.

## [1.0.0] - 2026-10-26

### Added
- Prototipo de la app BeValk portado a Vite, React y TypeScript, con paridad visual verificada contra la referencia: 1.470 capturas sin diferencias.
- 30 flujos en 8 grupos funcionales, en Freemium y Premium.
- 62 casos extremos ejecutables.
- Comprobación automática en cada cambio: tipos, tests unitarios, e2e, accesibilidad y regresión visual.
