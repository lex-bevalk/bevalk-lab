import './proto-switch.css';

function isReviewPage(pathname: string): boolean {
  return pathname.startsWith('/review')
    || pathname.startsWith('/concept/review')
    || pathname.endsWith('-review.html')
    || pathname.endsWith('/review.html');
}

export default function ProtoSwitch() {
  const proto = document.documentElement.dataset.proto === 'concept' ? 'concept' : 'current';
  const review = isReviewPage(window.location.pathname);
  const currentHref = review ? '/review' : '/';
  const conceptHref = review ? '/concept/review' : '/concept';

  return (
    <nav className="proto-switch" aria-label="Prototipo">
      <a href={currentHref} aria-current={proto === 'current' ? 'page' : undefined}>Current version</a>
      <a href={conceptHref} aria-current={proto === 'concept' ? 'page' : undefined}>Concept</a>
    </nav>
  );
}
