/* =========================================================
   ARTHNIX — Shared Component Loader
   File: /components.js
   Loads:
   - /nav.html
   - /footer.html
   Works on root pages and nested pages such as:
   /tools/gst-calculator.html
   Usage:
   <div id="site-nav"></div>
   <div id="site-footer"></div>
   <script src="/components.js"></script>
   ========================================================= */
(() => {
  "use strict";
  // Resolve shared components relative to this script's URL.
  // This avoids incorrect /tools/nav.html and /tools/footer.html paths.
  const currentScript =
    document.currentScript ||
    document.querySelector('script[src$="/components.js"], script[src="components.js"]');
  const scriptURL = currentScript
    ? currentScript.src
    : new URL("/components.js", window.location.origin).href;
  const COMPONENT_BASE_URL = new URL(".", scriptURL);
  const COMPONENTS = {
    nav: new URL("nav.html", COMPONENT_BASE_URL).href,
    footer: new URL("footer.html", COMPONENT_BASE_URL).href
  };
  let initializationPromise = null;
  /**
   * Load an HTML fragment into its target element.
   * Scripts inside the fragment are recreated so they execute.
   */
  async function loadComponent(targetId, fileURL) {
    const target = document.getElementById(targetId);
    if (!target) {
      console.warn(
        `[ARTHNIX] Component placeholder #${targetId} was not found.`
      );
      return false;
    }
    target.removeAttribute("data-component-error");
    try {
      const response = await fetch(fileURL, {
        cache: "no-cache",
        credentials: "same-origin"
      });
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} while loading ${fileURL}`
        );
      }
      const html = await response.text();
      const parsedDocument = new DOMParser().parseFromString(
        html,
        "text/html"
      );
      const fragment = document.createDocumentFragment();
      const scripts = [];
      // Copy body nodes and collect scripts for controlled execution.
      for (const node of Array.from(parsedDocument.body.childNodes)) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.tagName === "SCRIPT"
        ) {
          scripts.push(node);
        } else {
          fragment.appendChild(node.cloneNode(true));
        }
      }
      // Install the component markup first.
      target.replaceChildren(fragment);
      // Recreate component scripts after markup insertion.
      for (const originalScript of scripts) {
        const script = document.createElement("script");
        for (const attribute of Array.from(originalScript.attributes)) {
          script.setAttribute(attribute.name, attribute.value);
        }
        if (originalScript.src) {
          // Resolve relative script URLs against the component file.
          script.src = new URL(originalScript.getAttribute("src"), fileURL).href;
          // Wait for external scripts before continuing.
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(
              new Error(`Could not load component script: ${script.src}`)
            );
            target.appendChild(script);
          });
        } else {
          script.textContent = originalScript.textContent;
          target.appendChild(script);
        }
      }
      return true;
    } catch (error) {
      console.error(
        `[ARTHNIX] Could not load component #${targetId}:`,
        error
      );
      target.setAttribute("data-component-error", "true");
      target.setAttribute("aria-label", "Component could not be loaded");
      return false;
    }
  }
  /**
   * Load the shared navbar and footer, then initialize them.
   */
  async function initializeComponents() {
    // Prevent accidental simultaneous duplicate initializations.
    if (initializationPromise) {
      return initializationPromise;
    }
    initializationPromise = (async () => {
      const navLoaded = await loadComponent(
        "site-nav",
        COMPONENTS.nav
      );
      if (
        navLoaded &&
        typeof window.initializeArthnixNav === "function"
      ) {
        window.initializeArthnixNav();
      }
      const footerLoaded = await loadComponent(
        "site-footer",
        COMPONENTS.footer
      );
      if (
        footerLoaded &&
        typeof window.initializeArthnixFooter === "function"
      ) {
        window.initializeArthnixFooter();
      }
      document.documentElement.classList.add("components-loaded");
      document.dispatchEvent(
        new CustomEvent("arthnix:components-loaded", {
          detail: {
            navLoaded,
            footerLoaded
          }
        })
      );
      return { navLoaded, footerLoaded };
    })();
    try {
      return await initializationPromise;
    } finally {
      initializationPromise = null;
    }
  }
  // Expose the initializer for pages that need to reload components.
  window.initializeArthnixComponents = initializeComponents;
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeComponents,
      { once: true }
    );
  } else {
    initializeComponents();
  }
})();
