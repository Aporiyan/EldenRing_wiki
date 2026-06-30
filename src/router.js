let currentRoute = '/';
let cleanup = null;
let _navSeq = 0;

const routes = {};

export function registerRoute(pattern, handler) {
  routes[pattern] = handler;
}

function matchRoute(hash) {
  const noHash = hash.replace(/^#/, '');
  const qIdx = noHash.indexOf('?');
  const path = (qIdx >= 0 ? noHash.slice(0, qIdx) : noHash) || '/';
  const qs = qIdx >= 0 ? noHash.slice(qIdx + 1) : '';
  for (const [pattern, handler] of Object.entries(routes)) {
    const regex = new RegExp('^' + pattern.replace(/:id/g, '([^/]+)') + '$');
    const match = path.match(regex);
    if (match) {
      const params = {};
      const paramNames = [...pattern.matchAll(/:id/g)].map(m => m[0].slice(1));
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      // Parse query params
      if (qs) {
        new URLSearchParams(qs).forEach((v, k) => { params[k] = v; });
      }
      return { handler, params, path };
    }
  }
  return null;
}

export async function navigate(hash) {
  const seq = ++_navSeq;

  if (cleanup) {
    cleanup();
    cleanup = null;
  }

  const match = matchRoute(hash);
  if (!match) {
    navigate('#/');
    return;
  }

  currentRoute = match.path;
  const content = document.getElementById('content-area');

  // Deferred loading screen: only show if still the latest nav
  const loadingTimer = setTimeout(() => {
    if (seq === _navSeq) {
      content.innerHTML = '<div class="loading-screen"><div class="loading-ring"></div><div class="loading-text">加载中...</div></div>';
    }
  }, 120);

  cleanup = await match.handler(content, match.params);
  clearTimeout(loadingTimer);

  // If a newer navigation superseded this one, discard result
  if (seq !== _navSeq) {
    if (cleanup) { cleanup(); cleanup = null; }
    return;
  }

  // Scroll to top
  window.scrollTo(0, 0);

  // Update active nav
  document.querySelectorAll('.nav-item').forEach(el => {
    const route = el.dataset.route;
    if (route && route !== '/') {
      el.classList.toggle('active', match.path === route || match.path.startsWith(route + '/'));
    } else {
      el.classList.toggle('active', route === '/' && match.path === '/');
    }
  });
}

export function initRouter() {
  window.addEventListener('hashchange', () => {
    navigate(window.location.hash);
  });

  navigate(window.location.hash || '#/');
}
