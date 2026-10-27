import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Changelog from './Changelog.tsx';
import CommentsPage from './CommentsPage.tsx';
import './team.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname.startsWith('/comments') ? <CommentsPage /> : <Changelog />}
  </StrictMode>
);
