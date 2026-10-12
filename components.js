/* =========================================================
   ARTHNIX — Shared Component Loader
   File: components.js
   Loads:
   - nav.html
   - footer.html
   Usage:
   <div id="site-nav"></div>
   <div id="site-footer"></div>
   Load this file with the defer attribute.
   ========================================================= */
(() => {
  "use strict";
  /**
   * Load an HTML fragment into a page element.
   *
   * Scripts embedded in the fragment are recreated so they
   * execute after the fragment has been inserted.
   */
  async function loadComponent(targetId, filePath) {
    const target = document.getElementById(targetId);
    if (!target) {
      return false;
    }
    try {
      const response = await fetch(filePath, {
        cache: "no-cache"
      });
      if (!response.ok) {
        throw new Error(
          `Failed to load ${filePath}: HTTP ${response.status}`
        );
      }
      const html = await response.text();
      const parser = new DOMParser();
      const parsedDocument = parser.parseFromString(
        html,
        "text/html"
      );
      const fragment = document.createDocumentFragment();
      /*
       * Extract the parsed body nodes.
       * Scripts are handled separately because scripts inserted
       * through innerHTML do not execute automatically.
       */
      const scripts = [];
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
      target.replaceChildren(fragment);
      /*
       * Recreate scripts after the HTML has been inserted.
       */
      for (const originalScript of scripts) {
        const script = document.createElement("script");
        for (const attribute of originalScript.attributes) {
          script.setAttribute(attribute.name, attribute.value);
        }
        script.textContent = originalScript.textContent;
        target.appendChild(script);
      }
      return true;
    } catch (error) {
      console.error(
        `[ARTHNIX] Could not load ${filePath}:`,
        error
      );
      target.setAttribute("data-component-error", "true");
      return false;
    }
  }
  /**
   * Load the navbar and footer.
   */
  async function initializeComponents() {
    const navLoaded = await loadComponent(
      "site-nav",
      "nav.html"
    );
    if (navLoaded && typeof window.initializeArthnixNav === "function") {
      window.initializeArthnixNav();
    }
    const footerLoaded = await loadComponent(
      "site-footer",
      "footer.html"
    );
    if (
      footerLoaded &&
      typeof window.initializeArthnixFooter === "function"
    ) {
      window.initializeArthnixFooter();
    }
    document.documentElement.classList.add(
      "components-loaded"
    );
    document.dispatchEvent(
      new CustomEvent("arthnix:components-loaded", {
        detail: {
          navLoaded,
          footerLoaded
        }
      })
    );
  }
  /*
   * Expose the initializer in case a page needs to reload
   * shared components after a deliberate change.
   */
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
