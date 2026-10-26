import { createRoot } from 'react-dom/client';
import { Host } from './Host';
import './styles/odin/styles.css';
import './styles/main.css';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el elemento #root');

createRoot(root).render(<Host />);
