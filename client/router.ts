/** Valid application routes. */
export type Route = '/' | '/play' | '/result';

interface RouterOptions {
  skipPushState?: boolean;
}

interface ViewRegistration {
  el: HTMLElement;
  activate: () => void;
  deactivate: () => void;
}

/**
 * Lightweight SPA router.
 * REQ-RT-01/02/03: Shows lobby/play/result view for each route.
 * REQ-RT-04: Programmatic navigate() for WebSocket-triggered transitions.
 * REQ-RT-05: Only the active view is visible at any time.
 * REQ-RT-10: Browser back/forward via history.pushState + popstate.
 */
export class Router {
  private currentRoute: Route = '/';
  private views = new Map<Route, ViewRegistration>();

  /**
   * Register a view for a route. Must be called before init().
   */
  register(
    route: Route,
    el: HTMLElement,
    activate: () => void,
    deactivate: () => void,
  ): void {
    this.views.set(route, { el, activate, deactivate });
  }

  /**
   * Initialize the router: seed history state and activate the initial route.
   * Call after all views are registered.
   */
  init(): void {
    // Seed the first history entry with state so popstate fires correctly on Back
    history.replaceState({ path: window.location.pathname }, '', window.location.pathname);

    // REQ-RT-10: Handle browser Back/Forward
    window.addEventListener('popstate', (event: PopStateEvent) => {
      const path = (event.state as { path?: string } | null)?.path ?? '/';
      this.navigate(path as Route, { skipPushState: true });
    });

    const initial = this.parseRoute(window.location.pathname);
    this.showView(initial);
  }

  /**
   * Navigate to a route programmatically.
   * No-op if already on the requested route.
   */
  navigate(route: Route, options: RouterOptions = {}): void {
    if (route === this.currentRoute) return;

    const prev = this.views.get(this.currentRoute);
    if (prev) {
      prev.el.classList.add('hidden');
      prev.deactivate();
    }

    if (!options.skipPushState) {
      history.pushState({ path: route }, '', route);
    }

    this.showView(route);
  }

  getCurrentRoute(): Route {
    return this.currentRoute;
  }

  private showView(route: Route): void {
    this.currentRoute = route;
    const view = this.views.get(route);
    if (!view) return;

    view.el.classList.remove('hidden');
    // Remove then re-add view-active to re-trigger the bounceIn animation
    view.el.classList.remove('view-active');
    void view.el.offsetHeight; // force reflow so animation restarts
    view.el.classList.add('view-active');
    view.activate();
  }

  private parseRoute(pathname: string): Route {
    if (pathname === '/play') return '/play';
    if (pathname === '/result') return '/result';
    return '/';
  }
}
