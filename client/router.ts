// Minimal hash-based SPA router for quizzz

export type Route = '/' | '/play' | '/result';

type RouteHandler = () => void;

const routes = new Map<Route, RouteHandler>();

export function registerRoute(path: Route, handler: RouteHandler): void {
  routes.set(path, handler);
}

export function navigate(path: Route): void {
  location.hash = path === '/' ? '' : path;
  dispatch(path);
}

export function getCurrentRoute(): Route {
  const hash = location.hash.replace(/^#/, '') || '/';
  return (hash as Route) || '/';
}

function dispatch(path: Route): void {
  const handler = routes.get(path);
  if (handler) {
    handler();
  }
}

export function initRouter(): void {
  window.addEventListener('hashchange', () => {
    dispatch(getCurrentRoute());
  });
  // Dispatch initial route
  dispatch(getCurrentRoute());
}
