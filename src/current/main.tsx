import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Host } from './Host';
import './styles/odin.css';
import './styles/lab.css';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el elemento #root');

flushSync(() => createRoot(root).render(<Host />));
