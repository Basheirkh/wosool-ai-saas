/**
 * Context Reader Tool
 * Extracts page context including URL, DOM structure, and user position
 */
/** OLD START HERE
function getPageContext() {
  console.log('📖 Context Reader: Extracting page context...');
  
  try {
    const context = {
      url: window.location.href,
      pathname: window.location.pathname,
      hostname: window.location.hostname,
      pageType: detectPageType(),
      pageTitle: document.title,
      products: extractProductsFromPage(),
      categories: extractCategoriesFromPage(),
      currentCategory: getCurrentCategory(),
      userPosition: {
        scrollPercent: (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100,
        viewportHeight: window.innerHeight,
        scrollTop: window.scrollY
      },
      cartInfo: getCartInfo(),
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Context extracted:', context);
    return context;
  } catch (error) {
    console.error('❌ Context extraction error:', error);
    return { error: error.message };
  }
}

function detectPageType() {
  const pathname = window.location.pathname.toLowerCase();
  
  if (pathname.includes('/product/')) return 'product';
  if (pathname.includes('/category/')) return 'category';
  if (pathname.includes('/cart')) return 'cart';
  if (pathname.includes('/checkout')) return 'checkout';
  if (pathname.includes('/search')) return 'search';
  
  return 'home';
}

function extractProductsFromPage() {
  const products = [];
  
  try {
    const productElements = document.querySelectorAll('[data-product-id], .product-item, .product-card');
    
    productElements.forEach(el => {
      const product = {
        id: el.getAttribute('data-product-id') || el.id,
        name: el.querySelector('.product-name, .product-title, h2, h3')?.textContent?.trim(),
        price: el.querySelector('.product-price, .price, [data-price]')?.textContent?.trim(),
        image: el.querySelector('img')?.src,
        url: el.querySelector('a')?.href
      };
      
      if (product.id || product.name) {
        products.push(product);
      }
    });
  } catch (error) {
    console.warn('⚠️ Error extracting products:', error);
  }
  
  return products;
}

function extractCategoriesFromPage() {
  const categories = [];
  
  try {
    const categoryElements = document.querySelectorAll('[data-category-id], .category-item, .category-link');
    
    categoryElements.forEach(el => {
      const category = {
        id: el.getAttribute('data-category-id') || el.id,
        name: el.textContent?.trim(),
        url: el.href || el.getAttribute('data-url')
      };
      
      if (category.id || category.name) {
        categories.push(category);
      }
    });
  } catch (error) {
    console.warn('⚠️ Error extracting categories:', error);
  }
  
  return categories;
}

function getCurrentCategory() {
  try {
    const breadcrumb = document.querySelector('.breadcrumb, [data-breadcrumb]');
    if (breadcrumb) {
      return breadcrumb.textContent?.trim();
    }
    
    const categoryTitle = document.querySelector('.category-title, .page-title');
    if (categoryTitle) {
      return categoryTitle.textContent?.trim();
    }
  } catch (error) {
    console.warn('⚠️ Error getting current category:', error);
  }
  
  return null;
}

function getCartInfo() {
  try {
    const cartCount = document.querySelector('[data-cart-count], .cart-count, .badge');
    const cartTotal = document.querySelector('[data-cart-total], .cart-total, .total-price');
    
    return {
      itemCount: cartCount?.textContent?.trim(),
      total: cartTotal?.textContent?.trim()
    };
  } catch (error) {
    console.warn('⚠️ Error getting cart info:', error);
    return {};
  }
}

if (typeof window !== 'undefined') {
  window.__contextReader = { getPageContext };
}

OLD ENDs HERE

/**
 * Context Reader Tool
 * Extracts page context, including URL, DOM structure, e-commerce data,
 * and deep semantic content analysis.
 */

function getPageContext() {
  // This is now an entry point to the deeper context function
  return getDeepPageContext();
}

function getDeepPageContext() {
  console.log('📖 Context Reader: Extracting deep page context...');

  try {
    const baseContext = {
      url: window.location.href,
      pathname: window.location.pathname,
      hostname: window.location.hostname,
      pageType: detectPageType(),
      pageTitle: document.title,
      products: extractProductsFromPage(),
      categories: extractCategoriesFromPage(),
      currentCategory: getCurrentCategory(),
      userPosition: {
        scrollPercent: (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100,
        viewportHeight: window.innerHeight,
        scrollTop: window.scrollY
      },
      cartInfo: getCartInfo(),
      timestamp: new Date().toISOString()
    };

    const deepContext = {
      ...baseContext,
      content: {
        headings: extractHeadingHierarchy(),
        mainContent: extractMainContent(),
        metadata: extractMetadata(),
        forms: extractForms(),
        // interactions: extractInteractiveElements(), // Can be complex, omitting for brevity
        // media: extractMediaElements(), // Can be complex, omitting for brevity
      },
      performance: getPerformanceMetrics()
    };

    console.log('✅ Deep Context extracted:', deepContext);
    return deepContext;
  } catch (error) {
    console.error('❌ Context extraction error:', error);
    return {
      error: error.message
    };
  }
}

// --- E-COMMERCE & BASE CONTEXT HELPERS (Kept from original) ---

function detectPageType() {
  const pathname = window.location.pathname.toLowerCase();

  if (pathname.includes('/product/')) return 'product';
  if (pathname.includes('/category/')) return 'category';
  if (pathname.includes('/cart')) return 'cart';
  if (pathname.includes('/checkout')) return 'checkout';
  if (pathname.includes('/search')) return 'search';

  return 'home';
}

function extractProductsFromPage() {
  const products = [];
  try {
    const productElements = document.querySelectorAll('[data-product-id], .product-item, .product-card');

    productElements.forEach(el => {
      const product = {
        id: el.getAttribute('data-product-id') || el.id,
        name: el.querySelector('.product-name, .product-title, h2, h3')?.textContent?.trim(),
        price: el.querySelector('.product-price, .price, [data-price]')?.textContent?.trim(),
        image: el.querySelector('img')?.src,
        url: el.querySelector('a')?.href
      };

      if (product.id || product.name) {
        products.push(product);
      }
    });
  } catch (error) {
    console.warn('⚠️ Error extracting products:', error);
  }
  return products;
}

function extractCategoriesFromPage() {
  const categories = [];
  try {
    const categoryElements = document.querySelectorAll('[data-category-id], .category-item, .category-link');

    categoryElements.forEach(el => {
      const category = {
        id: el.getAttribute('data-category-id') || el.id,
        name: el.textContent?.trim(),
        url: el.href || el.getAttribute('data-url')
      };

      if (category.id || category.name) {
        categories.push(category);
      }
    });
  } catch (error) {
    console.warn('⚠️ Error extracting categories:', error);
  }
  return categories;
}

function getCurrentCategory() {
  try {
    const breadcrumb = document.querySelector('.breadcrumb, [data-breadcrumb]');
    if (breadcrumb) {
      // Find the last item in the breadcrumb which is typically the current category/page
      const lastItem = breadcrumb.querySelector('a:last-child, span:last-child');
      return lastItem?.textContent?.trim() || breadcrumb.textContent?.trim();
    }

    const categoryTitle = document.querySelector('.category-title, .page-title');
    if (categoryTitle) {
      return categoryTitle.textContent?.trim();
    }
  } catch (error) {
    console.warn('⚠️ Error getting current category:', error);
  }

  return null;
}

function getCartInfo() {
  try {
    const cartCount = document.querySelector('[data-cart-count], .cart-count, .badge');
    const cartTotal = document.querySelector('[data-cart-total], .cart-total, .total-price');

    return {
      itemCount: cartCount?.textContent?.trim(),
      total: cartTotal?.textContent?.trim()
    };
  } catch (error) {
    console.warn('⚠️ Error getting cart info:', error);
    return {};
  }
}

// --- NEW DEEP CONTENT ANALYSIS HELPERS ---

function getElementPosition(el) {
  // Simple check for visibility and screen position
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    isVisible: (rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth)
  };
}

/**
 * Extracts the hierarchy of headings (H1-H6) on the page.
 */
function extractHeadingHierarchy() {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  return headings.map(h => ({
    level: parseInt(h.tagName[1]),
    text: h.textContent?.trim(),
    id: h.id || h.getAttribute('name'),
    position: getElementPosition(h)
  }));
}

/**
 * Extracts the main content block, calculates word count, and reading time.
 */
function extractMainContent() {
  const contentSelectors = [
    'main', '[role="main"]', '.main-content',
    'article', '.content', '#content'
  ];

  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent?.trim() || '';
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
      // Standard reading speed is ~200 words per minute (WPM)
      const readingTime = Math.ceil(wordCount / 200);

      return {
        text: text.substring(0, 500) + (text.length > 500 ? '...' : ''), // Truncate text for context size
        wordCount: wordCount,
        readingTimeMinutes: readingTime,
        elementSelector: selector
      };
    }
  }
  return null;
}

/**
 * Extracts relevant metadata from the document head.
 */
function extractMetadata() {
  const metadata = {
    description: document.querySelector('meta[name="description"]')?.content,
    keywords: document.querySelector('meta[name="keywords"]')?.content,
    ogTitle: document.querySelector('meta[property="og:title"]')?.content,
    ogDescription: document.querySelector('meta[property="og:description"]')?.content,
    ogImage: document.querySelector('meta[property="og:image"]')?.content,
    canonical: document.querySelector('link[rel="canonical"]')?.href
  };

  return metadata;
}

/**
 * Extracts basic information about forms on the page.
 */
function extractForms() {
  const forms = Array.from(document.querySelectorAll('form'));
  return forms.map((form, index) => {
    const inputCount = form.querySelectorAll('input, textarea, select').length;
    const buttonText = form.querySelector('button[type="submit"], input[type="submit"]')?.textContent?.trim() || 'Submit';
    return {
      index: index,
      action: form.action,
      method: form.method,
      inputCount: inputCount,
      submitButtonText: buttonText
    };
  });
}

/**
 * Extracts basic performance metrics available via the browser's Performance API.
 */
function getPerformanceMetrics() {
  if (typeof performance === 'undefined' || !performance.timing) return null;

  const timing = performance.timing;
  const metrics = {
    // Basic navigation timings (in milliseconds)
    loadTime: timing.loadEventEnd - timing.navigationStart,
    domInteractive: timing.domInteractive - timing.navigationStart,
    contentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
  };

  return metrics;
}

if (typeof window !== 'undefined') {
  window.__contextReader = { getPageContext, getDeepPageContext };
}