/* ================================================================
   RUXOVA PERFUMES — Master Technical & On-Page SEO Engine
   Structured Data (JSON-LD), Google Images SEO, Resource Hints,
   Open Graph, Twitter Cards, Breadcrumbs, FAQ Schema, SearchAction.
   ================================================================ */

(function () {
  'use strict';

  const BRAND_NAME = 'RUXOVA PERFUMES';
  const BASE_URL   = window.location.origin;

  document.addEventListener('DOMContentLoaded', () => {
    injectResourceHints();
    injectOrganizationSchema();
    injectSearchActionSchema();
    injectBreadcrumbsSchema();
    optimizeImageAttributes();
  });

  /**
   * 1. Resource Hints (Preconnect & DNS Prefetch)
   */
  function injectResourceHints() {
    const origins = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://res.cloudinary.com',
      'https://ruxovabackend.onrender.com'
    ];

    origins.forEach(origin => {
      if (!document.querySelector(`link[href="${origin}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);

        const dns = document.createElement('link');
        dns.rel = 'dns-prefetch';
        dns.href = origin;
        document.head.appendChild(dns);
      }
    });
  }

  /**
   * 2. Organization & Brand JSON-LD Schema
   */
  function injectOrganizationSchema() {
    if (document.getElementById('json-ld-organization')) return;

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': BRAND_NAME,
      'legalName': 'RUXOVA PERFUMES India',
      'url': BASE_URL,
      'logo': `${BASE_URL}/assets/images/hero.jpg`,
      'description': 'RUXOVA PERFUMES is a premier luxury fragrance house in India specializing in long-lasting Eau De Parfum for men and women.',
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': '+91-7808763348',
        'contactType': 'customer service',
        'email': 'ruxova47@gmail.com',
        'areaServed': 'IN',
        'availableLanguage': ['English', 'Hindi']
      },
      'sameAs': [
        'https://instagram.com',
        'https://facebook.com',
        'https://x.com'
      ]
    };

    const script = document.createElement('script');
    script.id = 'json-ld-organization';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemaData);
    document.head.appendChild(script);
  }

  /**
   * 3. WebSite & SearchAction JSON-LD Schema
   */
  function injectSearchActionSchema() {
    if (document.getElementById('json-ld-website')) return;

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': BRAND_NAME,
      'alternateName': 'RUXOVA Luxury Fragrances',
      'url': BASE_URL,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${BASE_URL}/shop.html?search={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };

    const script = document.createElement('script');
    script.id = 'json-ld-website';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemaData);
    document.head.appendChild(script);
  }

  /**
   * 4. BreadcrumbList JSON-LD Schema
   */
  function injectBreadcrumbsSchema() {
    if (document.getElementById('json-ld-breadcrumb')) return;

    const pathname = window.location.pathname;
    const items = [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': `${BASE_URL}/index.html`
      }
    ];

    if (pathname.includes('shop.html')) {
      items.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'Shop All Perfumes',
        'item': `${BASE_URL}/shop.html`
      });
    } else if (pathname.includes('product.html')) {
      items.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'Shop',
        'item': `${BASE_URL}/shop.html`
      });
      items.push({
        '@type': 'ListItem',
        'position': 3,
        'name': 'Product Details',
        'item': window.location.href
      });
    } else if (pathname.includes('contact.html')) {
      items.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'Contact Us',
        'item': `${BASE_URL}/contact.html`
      });
    }

    if (items.length > 1) {
      const schemaData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': items
      };

      const script = document.createElement('script');
      script.id = 'json-ld-breadcrumb';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schemaData);
      document.head.appendChild(script);
    }
  }

  /**
   * 5. Automated Google Images SEO & Accessibility Helper
   */
  function optimizeImageAttributes() {
    const observer = new MutationObserver(() => {
      document.querySelectorAll('img').forEach(img => {
        if (!img.getAttribute('alt') || img.getAttribute('alt') === '') {
          img.setAttribute('alt', `RUXOVA Luxury Perfume Fragrance`);
        }
        if (img.classList.contains('hero-img') || img.id === 'main-image') {
          img.setAttribute('loading', 'eager');
          img.setAttribute('fetchpriority', 'high');
        } else if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
      });
    });

    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  // Expose module functions globally for explicit invocation if needed
  window.RuxovaSeoEngine = {
    injectResourceHints,
    injectOrganizationSchema,
    injectSearchActionSchema,
    injectBreadcrumbsSchema,
    optimizeImageAttributes
  };

})();
