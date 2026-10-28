import { createRoot } from 'react-dom/client';
import ProtoSwitch from './ProtoSwitch';

const root = document.getElementById('proto-root');
if (!root) throw new Error('No se encontró el elemento #proto-root');

createRoot(root).render(<ProtoSwitch />);
