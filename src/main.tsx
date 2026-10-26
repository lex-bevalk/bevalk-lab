import { createRoot } from 'react-dom/client';
import { Host } from './Host';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el elemento #root');

createRoot(root).render(<Host />);
