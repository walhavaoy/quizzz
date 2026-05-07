// Hash-based SPA router for quizzz

const VIEW_MAP: Record<string, string> = {
  '/': 'view-lobby',
  '/play': 'view-play',
  '/result': 'view-result',
};

function showView(): void {
  const hash = location.hash.slice(1) || '/';
  const viewId = VIEW_MAP[hash] ?? 'view-lobby';

  document.querySelectorAll<HTMLElement>('.view').forEach((el) => {
    el.classList.remove('active');
  });

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
  }
}

export function navigate(path: string): void {
  location.hash = path;
}

export function initRouter(): void {
  window.addEventListener('hashchange', showView);
  showView();
}
