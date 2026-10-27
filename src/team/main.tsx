import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Changelog from './Changelog.tsx';
import './team.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Changelog />
  </StrictMode>
);
