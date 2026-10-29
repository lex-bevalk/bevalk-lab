import { StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import Review from './Review.tsx';
import './review.css';

const root = document.getElementById('review-root');
if (!root) throw new Error('No se encontró el elemento #review-root');

flushSync(() => createRoot(root).render(
  <StrictMode>
    <Review />
  </StrictMode>
));
