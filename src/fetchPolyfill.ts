// Window fetch getter/setter shim to ensure safe assignment across all browser and iframe environments
(function ensureFetchSetter() {
  if (typeof window === 'undefined') return;
  try {
    const proto = (typeof Window !== 'undefined' && Window.prototype) || Object.getPrototypeOf(window);
    const nativeFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;
    let currentFetch = nativeFetch;

    const descriptor: PropertyDescriptor = {
      get() {
        return currentFetch;
      },
      set(fn) {
        currentFetch = fn;
      },
      configurable: true,
      enumerable: true
    };

    try {
      Object.defineProperty(window, 'fetch', descriptor);
    } catch {
      // Ignore if defineProperty fails on window
    }

    if (proto && proto !== window) {
      try {
        Object.defineProperty(proto, 'fetch', descriptor);
      } catch {
        // Ignore if defineProperty fails on prototype
      }
    }
  } catch {
    // Silent fail-safe
  }
})();

export {};
