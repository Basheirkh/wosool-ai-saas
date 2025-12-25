// Wosool Widget v3.1.1 - FULL UNABRIDGED (Infinite Loop Fix + Context Memory)
(function() {
  'use strict';

  // Backend URL - Update this with your production server URL
  const BACKEND_URL = 'https://wosool-app-production.up.railway.app';
  
  // Detect mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Log version to verify correct file is loaded
  console.log('📦 Widget Version: 3.1.1 | Build: FULL_UNABRIDGED_FIX');
  console.log('🔗 Backend URL:', BACKEND_URL);
  console.log('📱 Device:', isMobile ? 'Mobile' : 'Desktop', '| iOS:', isIOS);
  console.log('🌐 User Agent:', navigator.userAgent);
  
  const WOSOOL_API_URL = `${BACKEND_URL}/api/widget`;
  
  // Extract store ID - prefer merchant identifier from URL params, fallback to path
  // Use cached store ID if available (persists across navigation)
  let STORE_ID = sessionStorage.getItem('wosool_store_id');
  
  if (!STORE_ID) {
    const urlParams = new URLSearchParams(window.location.search);
    const merchantId = urlParams.get('identifier'); // Salla merchant ID from URL
    const pathParts = window.location.pathname.split('/').filter(p => p);
    const pathStoreId = pathParts[0] || window.location.hostname.split('.')[0] || 'test';
    
    // Use merchant ID if available, otherwise use path-based store ID
    STORE_ID = merchantId || pathStoreId;
    
    // Cache the store ID for future page loads
    sessionStorage.setItem('wosool_store_id', STORE_ID);
    console.log('💾 Cached store ID:', STORE_ID);
  } else {
    console.log('📦 Using cached store ID:', STORE_ID);
  }

  console.log('🚀 Wosool Widget Loading for store:', STORE_ID);
  console.log('📍 Full URL:', window.location.href);

  // --- Utility Functions (Notification and Branding logic omitted for brevity as they are stable) ---
  
  function showNotification(message, type = 'info') {
    // ... (Your notification function here) ...
    const colors = {
      info: '#155dfd',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    };
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: ${colors[type] || colors.info};
      color: white; padding: 15px 20px; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px; max-width: 300px; animation: slideIn 0.3s ease-out;
    `;
    if (!document.querySelector('#wosool-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'wosool-notification-styles';
      style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
      document.head.appendChild(style);
    }
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  window.__wosoolQuickHide = function() {
    // ... (Your branding function here) ...
    const widgetEl = document.querySelector('elevenlabs-convai');
    if (!widgetEl || !widgetEl.shadowRoot) { return; }
    try {
      const shadowRoot = widgetEl.shadowRoot;
      let count = 0;
      const walker = document.createTreeWalker(
        shadowRoot, 
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      let node;
      const textNodesToReplace = [];
      while (node = walker.nextNode()) {
        if (node.textContent && (node.textContent.includes('ElevenLabs') || node.textContent.includes('elevenlabs'))) {
          textNodesToReplace.push(node);
        }
      }
      textNodesToReplace.forEach(node => {
        node.textContent = node.textContent.replace(/ElevenLabs/g, 'Wosool.ai');
        node.textContent = node.textContent.replace(/elevenlabs/g, 'wosool.ai');
        count++;
      });
      const links = shadowRoot.querySelectorAll('a');
      links.forEach(link => {
        if (link.href && link.href.includes('elevenlabs')) {
          link.href = 'https://wosool.ai';
        }
        if (link.textContent && link.textContent.includes('ElevenLabs')) {
          link.textContent = link.textContent.replace(/ElevenLabs/g, 'Wosool.ai');
          link.textContent = link.textContent.replace(/elevenlabs/g, 'wosool.ai');
          count++;
        }
      });
      if (count > 0) {
        // console.log(`✅ Wosool branding applied (${count} replacements)`);
      }
    } catch (e) {
      console.error('⚠️ Shadow DOM access/branding error:', e);
    }
  };


  // No need for separate functions - define inline in event listener

  // --- Extract Salla Store Parameters ---
  function extractSallaParameters() {
    const params = {
      store: {},
      customer: {},
      user: {}
    };
    
    // Method 1: From window.SallaSettings (if available)
    if (window.SallaSettings) {
      params.store = {
        id: window.SallaSettings.store?.id || null,
        domain: window.SallaSettings.store?.domain || window.location.hostname,
        email: window.SallaSettings.store?.email || null,
        username: window.SallaSettings.store?.username || null
      };
      
      params.customer = {
        id: window.SallaSettings.customer?.id || null,
        name: window.SallaSettings.customer?.name || null,
        email: window.SallaSettings.customer?.email || null,
        mobile: window.SallaSettings.customer?.mobile || null
      };
      
      params.user = {
        id: window.SallaSettings.user?.id || null,
        email: window.SallaSettings.user?.email || null,
        phone: window.SallaSettings.user?.phone || null
      };
    }
    
    // Method 2: From Salla object (alternative)
    if (window.salla) {
      if (window.salla.config) {
        params.store.id = params.store.id || window.salla.config.store_id;
        params.store.domain = params.store.domain || window.salla.config.store_domain;
      }
      
      if (window.salla.customer) {
        params.customer.id = params.customer.id || window.salla.customer.id;
        params.customer.name = params.customer.name || window.salla.customer.name;
        params.customer.email = params.customer.email || window.salla.customer.email;
        params.customer.mobile = params.customer.mobile || window.salla.customer.mobile;
      }
    }
    
    // Method 3: From meta tags
    const metaStore = document.querySelector('meta[name="store-id"]');
    if (metaStore) {
      params.store.id = params.store.id || metaStore.content;
    }
    
    // Always include current domain as fallback
    params.store.domain = params.store.domain || window.location.hostname;
    
    return params;
  }

  // --- Core Widget Loading ---

  async function loadWidget() {
    try {
      // Check for cached config first
      const cachedConfig = sessionStorage.getItem('wosool_widget_config');
      let config;
      
      if (cachedConfig) {
        console.log('📦 Using cached widget config');
        config = JSON.parse(cachedConfig);
      } else {
        console.log('📡 Fetching widget config from:', `${WOSOOL_API_URL}/config?store_id=${STORE_ID}`);
        
        const response = await fetch(`${WOSOOL_API_URL}/config?store_id=${STORE_ID}`);
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        config = await response.json();
        console.log('📦 Widget config received:', config);
        
        // Cache the config for future page loads
        sessionStorage.setItem('wosool_widget_config', JSON.stringify(config));
        console.log('💾 Cached widget config');
      }
      
      // ... (Config check) ...
      if (!config.success || !config.is_active) {
        console.log('⚠️ Widget inactive or not configured:', { success: config.success, is_active: config.is_active });
        return;
      }

      const agentId = config.agent_id;
      
      // Extract Salla parameters for context
      const sallaParams = extractSallaParameters();
      console.log('📋 Salla parameters extracted:', sallaParams);

      // ==========================================================
      // [NEW] 1. Retrieve Previous Context (Memory)
      // ==========================================================
      let previousContext = {};
      try {
          const savedContext = sessionStorage.getItem('wosool_prev_context');
          if (savedContext) {
              previousContext = JSON.parse(savedContext);
              // Optional: Clear after reading to avoid stale data
              // sessionStorage.removeItem('wosool_prev_context');
          }
      } catch (e) {
          console.error('Error reading previous context:', e);
      }
      
      // Create and append widget element
      const widget = document.createElement('elevenlabs-convai');
      widget.setAttribute('agent-id', agentId);
      
      // Pass Salla parameters as client data
      const clientData = {
        store_id: sallaParams.store.id,
        store_domain: sallaParams.store.domain,
        store_email: sallaParams.store.email,
        store_username: sallaParams.store.username,
        customer_id: sallaParams.customer.id,
        customer_name: sallaParams.customer.name,
        customer_email: sallaParams.customer.email,
        customer_mobile: sallaParams.customer.mobile,
        user_id: sallaParams.user.id,
        user_email: sallaParams.user.email,
        user_phone: sallaParams.user.phone,

        // ==========================================================
        // [NEW] 2. Inject Previous Context into Client Data
        // ==========================================================
        previous_page: previousContext.last_url || null,
        previous_title: previousContext.last_page_title || null,
        last_product_seen: previousContext.last_product_viewed || null
      };
      
      widget.setAttribute('client-data', JSON.stringify(clientData));
      console.log('📤 Client data set:', clientData);
      
      document.body.appendChild(widget);
      console.log('✅ Widget element created with agent:', agentId);

      // Load the widget script
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      
      script.onerror = function(error) {
        console.error('❌ Failed to load ElevenLabs widget script:', error);
        console.error('Script src:', script.src);
        console.error('This may be due to:');
        console.error('- Network connectivity issues');
        console.error('- CDN blocked by firewall/ad blocker');
        console.error('- Mobile browser restrictions');
        showNotification('Failed to load chat widget. Please check your connection.', 'error');
      };

      script.onload = function() {
        console.log('✅ Widget script loaded successfully');
        console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');
        console.log('🔧 Setting up event listeners...');
        
        // OFFICIAL PATTERN: Set up event listener after script loads
        const widgetEl = document.querySelector('elevenlabs-convai');
        
        if (widgetEl) {
          console.log('✅ Widget element found in DOM');
          
          // Check if widget has shadow root (indicates it's rendered)
          setTimeout(() => {
            if (widgetEl.shadowRoot) {
              console.log('✅ Widget shadow DOM rendered successfully');
            } else {
              console.warn('⚠️ Widget element exists but shadow DOM not rendered yet');
              console.warn('This may indicate:');
              console.warn('- Widget still initializing');
              console.warn('- Mobile browser compatibility issue');
              console.warn('- ElevenLabs widget blocked');
            }
          }, 2000);
          
          // Listen for messages from the agent (Server Tool responses)
          widgetEl.addEventListener('elevenlabs-convai:message', (event) => {
            console.log('📨 Agent message received:', event.detail);
            
            // Check if message contains metadata for execution
            const message = event.detail;
            if (message && message.metadata && message.metadata.execute_script) {
              console.log('🔧 Executing server tool action:', message.metadata);
              handleServerToolResponse(message.metadata);
            }
          });
          
          console.log('✅ Event listener attached successfully');
        } else {
          console.error('❌ Widget element not found in DOM after script load');
        }
        
        // Handle server tool responses
        async function handleServerToolResponse(metadata) {
          console.log('⚡ handleServerToolResponse called with:', metadata);
          console.log('⚡ Executing action:', metadata.action);
          
          if (metadata.action === 'navigate') {
            console.log('🚀 Navigate action detected, url:', metadata.url, 'target:', metadata.target);
            // Execute navigation - RETURN a promise so it can be awaited
            const { url, target } = metadata;
            
            if (!url) {
              console.error('❌ No URL provided for navigation');
              return Promise.resolve(); // Return resolved promise
            }
            
            console.log('🔧 Navigating to:', url, 'Target:', target);
            
            // Return a promise that resolves after navigation starts
            return new Promise((resolve) => {
              // Small delay to allow agent message to display
              setTimeout(() => {
                
                // ==========================================================
                // [NEW] 3. Save Context Before Navigation
                // ==========================================================
                try {
                    const preNavContext = {
                        last_url: window.location.href,
                        last_page_title: document.title,
                        timestamp: Date.now()
                    };

                    // Attempt to capture product name if we are on a product page
                    // This helps the agent remember what user was looking at
                    const productName = document.querySelector('h1, .product-title, .product-name, .s-product-card-title');
                    if (productName) {
                        preNavContext.last_product_viewed = productName.textContent.trim();
                    }

                    sessionStorage.setItem('wosool_prev_context', JSON.stringify(preNavContext));
                    console.log('💾 Context saved before navigation:', preNavContext);
                } catch (e) {
                    console.warn('⚠️ Failed to save pre-navigation context', e);
                }

                try {
                  if (target === '_blank') {
                    window.open(url, '_blank', 'noopener,noreferrer');
                    console.log('✅ Opened in new tab:', url);
                    resolve(); // Resolve immediately for new tab
                  } else {
                    console.log('✅ Navigating to:', url);
                    
                    // Check if we're navigating within the same domain
                    const currentDomain = window.location.origin;
                    const targetUrl = new URL(url);
                    const isSameDomain = targetUrl.origin === currentDomain;
                    
                    if (isSameDomain && window.salla && window.salla.navigate) {
                      // Use Salla's native navigation (SPA style - no reload)
                      console.log('🚀 Using Salla SPA navigation');
                      window.salla.navigate(targetUrl.pathname + targetUrl.search);
                      resolve(); // Resolve after SPA navigation
                    } else {
                      // Fallback: Full page reload with cache bust
                      console.log('🔄 Using full page reload');
                      const separator = url.includes('?') ? '&' : '?';
                      const freshUrl = `${url}${separator}_t=${Date.now()}`;
                      
                      // Resolve BEFORE unload to ensure ACK sends if possible
                      resolve(); 
                      window.location.href = freshUrl;
                    }
                  }
                } catch (error) {
                  console.error('❌ Navigation error:', error);
                  // Fallback to simple navigation
                  resolve(); // Resolve before reload
                  window.location.href = url;
                }
              }, 500);
            });
            
          } else if (metadata.action === 'add_to_cart') {
            // Add product to cart - RETURN the promise!
            console.log('🛒 Adding product to cart...');
            
            return (async () => {
              try {
                const { product_id, quantity = 1, options } = metadata;
                
                if (!product_id) {
                  console.error('❌ No product_id provided');
                  return;
                }
                
                console.log(`🛒 Adding product ${product_id} (qty: ${quantity}) to cart`);
                if (options) {
                  console.log(`📋 With options:`, options);
                }
                
                // Try to use Salla Cart API
                let result = { success: false, error: 'Not implemented' };
                
                // Method 1: Try Salla.cart.addItem() if available
                if (window.salla && window.salla.cart && typeof window.salla.cart.addItem === 'function') {
                  try {
                    // Salla.cart.addItem accepts: (product_id, quantity, options)
                    await window.salla.cart.addItem(product_id, quantity, options);
                    result = { success: true, message: 'تم إضافة المنتج للسلة' };
                    console.log('✅ Product added via Salla.cart.addItem');
                  } catch (error) {
                    console.error('❌ Salla.cart.addItem failed:', error);
                    result = { success: false, error: error.message };
                  }
                }
                // Method 2: Try clicking "Add to Cart" button
                else {
                  // Try multiple selectors for Salla add to cart button
                  const selectors = [
                    `button[data-product-id="${product_id}"]`,
                    `button[data-id="${product_id}"]`,
                    `.add-to-cart[data-id="${product_id}"]`,
                    'button.add-to-cart',
                    'button[class*="add-cart"]',
                    'button[class*="add-to-cart"]',
                    '.s-button-primary',
                    'button[type="submit"].s-button-btn',
                    'salla-add-product-button button',
                    'button:has(svg[class*="cart"])',
                    'button:has(.icon-cart)',
                    'button[onclick*="cart"]'
                  ];
                  
                  let addToCartBtn = null;
                  for (const selector of selectors) {
                    try {
                      addToCartBtn = document.querySelector(selector);
                      if (addToCartBtn && addToCartBtn.offsetParent !== null) {
                        console.log(`✅ Found button with selector: ${selector}`);
                        break;
                      }
                    } catch (e) {
                      // Invalid selector, skip
                    }
                  }
                  
                  if (addToCartBtn) {
                    addToCartBtn.click();
                    result = { success: true, message: 'تم النقر على زر الإضافة للسلة' };
                    console.log('✅ Clicked add to cart button');
                    
                    // Wait a bit for cart to update
                    await new Promise(resolve => setTimeout(resolve, 500));
                  } else {
                    result = { success: false, error: 'لم يتم العثور على زر الإضافة للسلة' };
                    console.error('❌ Add to cart button not found');
                    console.log('Available buttons:', Array.from(document.querySelectorAll('button')).map(b => b.className));
                  }
                }
                
                // Send result back to backend and RETURN the promise
                console.log('📤 Sending cart result to backend:', result);
                console.log('📝 Command ID:', metadata.id);
                
                return fetch(`${BACKEND_URL}/api/webhooks/elevenlabs/tools/cart-response`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    command_id: metadata.id,
                    result: result
                  })
                }).then(response => {
                  console.log('📡 Response status:', response.status);
                  return response.json();
                })
                  .then(data => {
                    console.log('✅ Cart result sent to backend:', data);
                    if (!data.success) {
                      console.warn('⚠️ Backend did not accept result:', data.message);
                    }
                    return data;
                  })
                  .catch(error => {
                    console.error('❌ Failed to send cart result:', error);
                    throw error;
                  });
                
              } catch (error) {
                console.error('❌ Add to cart error:', error);
                
                // Send error result and return promise
                return fetch(`${BACKEND_URL}/api/webhooks/elevenlabs/tools/cart-response`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    command_id: metadata.id,
                    result: { success: false, error: error.message }
                  })
                }).then(r => r.json()).catch(() => {});
              }
            })();
            
          } else if (metadata.action === 'read_context') {
            // Read page context
            console.log('🔧 Reading page context...');
            
            try {
              const scope = metadata.scope || 'full';
              
              // Check if we already have auto-read context
              if (window.__wosoolPageContext && window.__wosoolPageContext.product_info) {
                console.log('⚡ Using cached auto-context');
                const context = window.__wosoolPageContext;
                
                // Send cached context immediately and return promise
                return fetch(`${BACKEND_URL}/api/webhooks/elevenlabs/tools/context-response`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    command_id: metadata.id,
                    context_data: context
                  })
                }).then(response => response.json())
                  .then(data => {
                    console.log('✅ Cached context sent to backend:', data);
                    return data;
                  })
                  .catch(error => {
                    console.error('❌ Failed to send cached context:', error);
                    throw error;
                  });
              }
              
              // Otherwise, read fresh context
              let context = {
                url: window.location.href,
                title: document.title,
                path: window.location.pathname,
                timestamp: new Date().toISOString()
              };
              
              // Read based on scope
              if (scope === 'full' || scope === 'product') {
                // Helper function to clean text
                const cleanText = (text) => {
                  if (!text) return null;
                  return text
                    .replace(/\n+/g, ' ')  // Replace newlines with space
                    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
                    .replace(/keyboard_arrow_\w+/g, '') // Remove keyboard arrow icons
                    .replace(/\s*[\u25B6\u25C0\u25B8\u25C2]\s*/g, ' ') // Remove arrow characters
                    .trim();
                };
                
                // Extract all products from the page
                const productCards = Array.from(document.querySelectorAll('.product-item, .s-product-item, [data-product-id], .product-card, [class*="product-item"]'));
                const products = [];
                
                if (productCards.length > 0) {
                  productCards.forEach(card => {
                    try {
                      // Extract product name
                      const nameEl = card.querySelector('h3, h2, .product-name, [class*="product-title"], .s-product-card-title, [class*="name"], [class*="title"]');
                      const name = cleanText(nameEl?.textContent);
                      
                      // Only process if we have a valid product name
                      if (name) {
                        // Extract price
                        const priceEl = card.querySelector('[class*="price"], .price, .s-product-card-price, .s-product-card-price-amount, [class*="amount"], [class*="value"]');
                        let price = priceEl?.textContent?.trim() || '';
                        if (price) {
                          const priceMatch = price.match(/[\d٠-٩]+/);
                          price = priceMatch ? priceMatch[0] + ' ريال' : cleanText(price);
                        }
                        
                        // Extract image
                        const imageEl = card.querySelector('img[src*="product"], img[src*="Product"], img[src*="item"]');
                        const image = imageEl?.src || '';
                        
                        // Extract product URL
                        const linkEl = card.closest('a') || card.querySelector('a[href*="product"], a[href*="Product"], a[href*="item"]');
                        const url = linkEl?.href || '';
                        
                        // Check if product is in stock
                        const inStock = card.querySelector('.add-to-cart, [class*="add-cart"], button[data-cart], [class*="add-to-cart"], [class*="add_to_cart"]') ? 'متاح' : 'غير متاح';
                        
                        // Add product to the list
                        products.push({
                          name: name,
                          price: price,
                          image: image,
                          url: url,
                          in_stock: inStock
                        });
                      }
                    } catch (e) {
                      console.error('Error processing product card:', e);
                    }
                  });
                }
                
                // Store all products in context
                context.products = products.length > 0 ? products : null;
                
                // For backward compatibility, also include single product info
                const firstProduct = products[0] || {};
                
                // Get category from breadcrumb (take last meaningful item)
                const breadcrumbEl = document.querySelector('.breadcrumb, [class*="breadcrumb"]');
                let category = null;
                if (breadcrumbEl) {
                  const items = breadcrumbEl.textContent.split('\n');
                  // Process breadcrumb items to find the category
                  const cleanItems = items
                    .map(item => cleanText(item))
                    .filter(Boolean); // Remove empty items
                  
                  // Get the last non-empty item as category
                  category = cleanItems[cleanItems.length - 1] || null;
                }

                // Get Cart Count
                const cartCountEl = document.querySelector('.cart-count, .s-cart-summary-count, [data-cart-count]');
                const cartCount = cartCountEl ? cartCountEl.textContent.trim() : '0';

                // Add cart info to context
                context.cart_info = {
                  items_count: cartCount || '0',
                  has_items: cartCount && parseInt(cartCount) > 0
                };
                
                // For backward compatibility, maintain the product_info structure
                context.product_info = {
                  name: firstProduct.name || cleanText(document.querySelector('h1, .product-title, [class*="product-title"]')?.textContent) || 'منتج غير معروف',
                  price: firstProduct.price || '',
                  category: category || 'فئة غير محددة',
                  description: cleanText(document.querySelector('.product-description, [class*="description"]')?.textContent)?.substring(0, 200) || (firstProduct.description?.substring(0, 200) || ''),
                  add_to_cart: firstProduct?.in_stock || 'غير متاح',
                  images: firstProduct.image ? [firstProduct.image] : Array.from(document.querySelectorAll('.product-image img, [class*="product-image"] img')).slice(0, 3).map(img => img.src)
                };
                
                // Add product count to context
                context.product_count = products.length;
              }
              
              console.log('✅ Page context read:', context);
              
              // Send context back to backend and get formatted message - RETURN the promise
              return fetch(`${BACKEND_URL}/api/webhooks/elevenlabs/tools/context-response`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  command_id: metadata.id,
                  context_data: context
                })
              }).then(response => response.json())
                .then(data => {
                  console.log('✅ Context sent to backend:', data);
                  
                  // Send context as message to the agent via ElevenLabs widget
                  if (data.context_message) {
                    const widgetEl = document.querySelector('elevenlabs-convai');
                    
                    if (widgetEl) {
                      // Try multiple methods to send message
                      
                      // Method 1: Direct sendMessage (if available)
                      if (typeof widgetEl.sendMessage === 'function') {
                        widgetEl.sendMessage(data.context_message);
                        console.log('✅ Context sent via sendMessage()');
                      }
                      // Method 2: Dispatch custom event
                      else if (widgetEl.shadowRoot) {
                        const event = new CustomEvent('user-message', {
                          detail: { message: data.context_message }
                        });
                        widgetEl.dispatchEvent(event);
                        console.log('✅ Context sent via custom event');
                      }
                      // Method 3: Try to find input and simulate typing
                      else {
                        const input = widgetEl.shadowRoot?.querySelector('input, textarea') || 
                                     document.querySelector('input[placeholder*="message"], textarea[placeholder*="message"]');
                        if (input) {
                          input.value = data.context_message;
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                          console.log('✅ Context injected into input field');
                        } else {
                          console.warn('⚠️ Could not find method to send message to agent');
                          console.log('📝 Context message:', data.context_message);
                        }
                      }
                    } else {
                      console.warn('⚠️ ElevenLabs widget not found');
                      console.log('📝 Context message:', data.context_message);
                    }
                  }
                  return data; // Return data to complete the promise chain
                })
                .catch(error => {
                  console.error('❌ Failed to send context:', error);
                  throw error; // Re-throw to propagate error
                });
              
            } catch (error) {
              console.error('❌ Context reading error:', error);
              return Promise.reject(error); // Return rejected promise
            }
          } else {
            // Unknown action - log warning and return resolved promise
            console.warn('⚠️ Unknown action:', metadata.action);
            return Promise.resolve();
          }
        }
        
        // ==========================================================
        // [MODIFIED] 4. Polling with Infinite Loop Protection
        // ==========================================================
        async function pollForCommands() {
          try {
            const response = await fetch(`${BACKEND_URL}/api/webhooks/elevenlabs/tools/poll`);
            
            const data = await response.json();
            
            if (data.success && data.commands && data.commands.length > 0) {
              console.log(`📥 Received ${data.commands.length} pending command(s)`);
              
              // [FIX] Load processed commands from session storage
              let processedCommands = [];
              try {
                processedCommands = JSON.parse(sessionStorage.getItem('wosool_processed_commands') || '[]');
              } catch(e) {}

              // Execute each command
              for (const command of data.commands) {
                
                // [FIX] 1. Check if command was already processed locally
                if (processedCommands.includes(command.id)) {
                  console.log(`🚫 Skipping already processed command: ${command.id}`);
                  await fetch(`${BACKEND_URL}/api/webhooks/elevenlabs/tools/ack`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ command_id: command.id }),
                    keepalive: true // Crucial for mobile
                  });
                  continue;
                }

                console.log('🔧 Executing command:', command);
                console.log('📋 Command details:', {
                  id: command.id,
                  action: command.action,
                  url: command.url,
                  target: command.target,
                  timestamp: command.timestamp,
                  age_seconds: command.timestamp ? (Date.now() - command.timestamp) / 1000 : 'unknown'
                });
                
                // [FIX] 2. Mark command as processed IMMEDIATELY
                processedCommands.push(command.id);
                // Keep only last 20 commands to prevent storage bloat
                if (processedCommands.length > 20) processedCommands.shift();
                sessionStorage.setItem('wosool_processed_commands', JSON.stringify(processedCommands));

                // Skip commands older than 30 seconds to prevent stale executions
                if (command.timestamp && (Date.now() - command.timestamp) > 30000) {
                  console.warn(`⚠️ Skipping stale command ${command.id} (${Math.round((Date.now() - command.timestamp) / 1000)}s old)`);
                  // Still acknowledge to remove it from cache
                  await fetch(`${BACKEND_URL}/api/webhooks/elevenlabs/tools/ack`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ command_id: command.id }),
                    keepalive: true
                  });
                  continue;
                }
                
                try {
                  // [FIX] 3. Send ACK in parallel using keepalive
                  const ackPromise = fetch(`${BACKEND_URL}/api/webhooks/elevenlabs/tools/ack`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ command_id: command.id }),
                    keepalive: true
                  }).catch(e => console.error('Ack failed', e));

                  // Wait for command to complete
                  const result = await handleServerToolResponse(command);
                  console.log(`✅ Command ${command.id} completed successfully, result:`, result);
                  
                  // Ensure ACK sent
                  await ackPromise;
                  console.log(`✅ Command ${command.id} acknowledged`);
                } catch (error) {
                  console.error(`❌ Command ${command.id} failed:`, error);
                  // Ack anyway to prevent loops
                  await fetch(`${BACKEND_URL}/api/webhooks/elevenlabs/tools/ack`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command_id: command.id }),
                    keepalive: true
                  });
                }
              }
            }
          } catch (error) {
            // Silent fail - don't spam console with polling errors
            // console.error('Polling error:', error);
          }
        }
        
        // Start polling every 500ms (faster for context_reader)
        console.log('🔄 Starting command polling (every 500ms)...');
        const pollingInterval = setInterval(pollForCommands, 500);
        window.__wosoolPollingInterval = pollingInterval;
        
        // Do immediate poll on load
        pollForCommands();
        
        // --- AUTO-READ CONTEXT ON PAGE LOAD ---
        console.log('🔍 Auto-reading page context on load...');
        setTimeout(() => {
          // Automatically read context when page loads
          const autoContext = {
            url: window.location.href,
            title: document.title,
            path: window.location.pathname,
            timestamp: new Date().toISOString()
          };
          
          // Check if we're on a product page
          const isProductPage = window.location.pathname.includes('/p') || 
                               document.querySelector('h1, .product-title, [class*="product-title"]');
          
          if (isProductPage) {
            console.log('📦 Product page detected - reading context...');
            
            // Read product context
            const cleanText = (text) => {
              if (!text) return null;
              return text
                .replace(/\n+/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/keyboard_arrow_\w+/g, '')
                .trim();
            };
            
            const priceEl = document.querySelector('[class*="price"], .price, .s-product-card-price, .s-product-card-price-amount');
            let price = priceEl?.textContent?.trim();
            if (price) {
              const priceMatch = price.match(/[\d٠-٩]+/);
              price = priceMatch ? priceMatch[0] + ' ريال' : cleanText(price);
            }
            
            // Extract all products from the page with more specific selectors
            const productContainers = [
              // Salla-specific containers with higher specificity
              '.products-wrapper .product-list',
              '.products-wrapper .product-item',
              // Common e-commerce patterns
              '.products-grid .product-item',
              '.product-list > li',
              '.product-items > .item',
              // More specific to common e-commerce platforms
              '[data-product-id]',
              '[itemtype*="Product"]',
              // Fallback to common product item patterns
              '.product-item',
              '.s-product-item',
              '.product-card',
              // Last resort - look for any container with product data attributes
              '[data-product-id]',
              '[data-sku]',
              // Final fallback - any container with product in class
              '[class*="product"][class*="item"], [class*="product-item"], [class*="product-card"]'
            ];
            
            // Common price element selectors from various e-commerce platforms
            const priceSelectors = [
              '.price',
              '.product-price',
              '.amount',
              '.sale-price',
              '.regular-price',
              '.special-price',
              '.current-price',
              '[class*="price"][class*="amount"]',
              '[itemprop="price"]',
              '[data-price-type]',
              'span[data-price]',
              'span[data-price-type]',
              '.price-box',
              '.product-price-box',
              '.price-container'
            ].join(',');

            // Helper function to check if an element is visible
            const isVisible = (el) => {
              if (!el) return false;
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && 
                     style.visibility !== 'hidden' && 
                     style.opacity !== '0' &&
                     el.offsetWidth > 0 && 
                     el.offsetHeight > 0;
            };

            // Try to find product containers with direct product children
            let productCards = new Set(); // Use Set to avoid duplicates
            
            // First try: Look for direct product items in known containers
            for (const container of productContainers) {
              const containers = document.querySelectorAll(container);
              if (containers.length > 0) {
                containers.forEach(container => {
                  if (!isVisible(container)) return;
                  
                  // Look for direct children that look like product items
                  const items = Array.from(container.children || []).filter(isVisible);
                  
                  // If we found items in this container, add them
                  if (items.length > 0) {
                    items.forEach(item => productCards.add(item));
                  }
                });
                
                if (productCards.size > 0) break;
              }
            }
            
            // If we still don't have product cards, try a more aggressive approach
            if (productCards.size === 0) {
              // Look for any elements that might contain product info
              const potentialProducts = document.querySelectorAll([
                // Elements with product-related classes
                '[class*="product"], [class*="item-"], [class*="card-"]',
                // Common product item patterns
                'article, section, li, div, a'
              ].join(','));
              
              potentialProducts.forEach(el => {
                if (!isVisible(el)) return;
                
                // Check if this looks like a product card
                const hasName = el.querySelector('h1, h2, h3, h4, [class*="name"], [class*="title"]');
                const hasPrice = el.querySelector('[class*="price"], [class*="amount"], [class*="value"]');
                const hasImage = el.querySelector('img');
                
                if ((hasName && hasPrice) || (hasName && hasImage) || (hasPrice && hasImage)) {
                  productCards.add(el);
                }
              });
            }
            
            console.log(`Found ${productCards.size} potential product cards`);
            
            const products = [];
            const seenProducts = new Set(); // Track seen products to avoid duplicates
            
            console.log(`Processing ${productCards.size} potential product cards...`);
            
            // Process each product card
            Array.from(productCards).forEach((card, index) => {
              try {
                console.log(`Processing product card ${index + 1}/${productCards.size}`);
                
                // Skip if this card is a child of another product card we've already processed
                const isNested = Array.from(productCards).some(otherCard => 
                  otherCard !== card && otherCard.contains(card)
                );
                
                if (isNested) {
                  console.log(`Skipping nested card ${index + 1}`);
                  return;
                }
                
                // Check element size but be more lenient
                const rect = card.getBoundingClientRect();
                if (rect.width < 30 || rect.height < 30) {
                  console.log(`Skipping small card ${index + 1}:`, {width: rect.width, height: rect.height});
                  return;
                }
                
                // Extract product name - be more lenient
                let name = '';
                const nameSelectors = [
                  'h1', 'h2', 'h3', 'h4', 'h5', // All heading levels
                  '[class*="name" i]',
                  '[class*="title" i]',
                  '[class*="product" i] [class*="name" i]',
                  '[class*="item" i] [class*="name" i]',
                  '.product-title', '.product-name',
                  '.item-title', '.item-name',
                  '.title', '.name',
                  'a[href*="product" i], a[href*="item" i]',
                  'div > a > div:last-child', // Common pattern for product links
                  'div > a:has(img)' // Links containing images
                ];
                
                // Try each selector until we find a name
                for (const selector of nameSelectors) {
                  const nameEl = card.matches(selector) ? card : card.querySelector(selector);
                  if (nameEl && nameEl.textContent && nameEl.textContent.trim()) {
                    name = cleanText(nameEl.textContent);
                    if (name && name.length >= 2 && name.length <= 200) {
                      break;
                    }
                  }
                }
                
                // If still no name, try to find any text in the card
                if (!name) {
                  const textContent = card.textContent || '';
                  const potentialName = cleanText(textContent.split('\n')[0] || '');
                  if (potentialName && potentialName.length >= 2 && potentialName.length <= 200) {
                    name = potentialName;
                  } else {
                    console.log(`Skipping card ${index + 1}: No valid name found`);
                    return;
                  }
                }
                
                console.log(`Found product name: "${name}"`);
                
                // Enhanced price extraction with Salla-specific patterns
                let price = '';
                
                // Log the card HTML for debugging
                console.log('Card HTML:', card.outerHTML);
                
                // 1. First try specific Salla price elements
                const sallaPriceEl = card.querySelector([
                    // Salla specific price elements
                    '.product-card__price',
                    '.product-card__price .price',
                    '.product-card__price .amount',
                    '.product-card__price .price-amount',
                    '.product-card__price .product-price',
                    '.product-card__price [data-product-price]',
                    '.product-card__price [data-price]',
                    '.product-card__price [itemprop="price"]',
                    
                    // General price elements
                    '.price',
                    '.product-price',
                    '.price-amount',
                    '.amount',
                    '[data-product-price]',
                    '[data-price]',
                    '[itemprop="price"]',
                    '.price--withoutTax',
                    '.price--withTax',
                    
                    // More specific price element paths
                    '.product-card .price',
                    '.product-item .price',
                    '.product-card__content .price',
                    '.product-card__footer .price',
                    
                    // Fallback to any element with price in class
                    '[class*="price"]',
                    '[class*="amount"]'
                ].join(','));
                
                if (sallaPriceEl) {
                    console.log('Found price element:', sallaPriceEl.outerHTML);
                    const priceText = sallaPriceEl.textContent.trim();
                    console.log('Price text from element:', priceText);
                    
                    // Extract numeric price using regex
                    const priceMatch = priceText.match(/([\d٠-٩,.]*\.?[\d٠-٩]+)/);
                    if (priceMatch) {
                        let priceValue = priceMatch[1];
                        
                        // Normalize decimal separator
                        priceValue = priceValue.replace(/[,\u066B\u066C]/g, '.');
                        
                        // Format the price with currency
                        price = priceValue + ' ر.س';
                        console.log('Extracted price:', price);
                    }
                }
                
                // 2. If no price found, try regex on card text
                if (!price) {
                    console.log('No price found in dedicated elements, trying regex on card text');
                    const priceRegex = /(?:\s|^|>)([\d٠-٩]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:ر\.?س|ريال|SAR|SR|ر.س|ر\s*س|$)/i;
                    const match = card.textContent.match(priceRegex);
                    
                    if (match) {
                        let priceValue = match[1];
                        console.log('Found price with regex:', priceValue);
                        
                        // Normalize decimal separator
                        priceValue = priceValue.replace(/[,\u066B\u066C]/g, '.');
                        
                        // Format the price with currency
                        price = priceValue + ' ر.س';
                        console.log('Formatted price:', price);
                    }
                }
                
                // If we still don't have a price, set a default message
                if (!price) {
                  console.log('No price found for product');
                  price = 'السعر غير متوفر';
                }
                
                // Create a unique key for this product to avoid duplicates
                const productKey = `${name.toLowerCase()}_${price}`;
                if (seenProducts.has(productKey)) return;
                seenProducts.add(productKey);
                
                // Extract image
                let image = '';
                const imageEl = card.querySelector('img');
                if (imageEl && imageEl.src && 
                    !imageEl.src.includes('placeholder') && 
                    !imageEl.src.startsWith('data:')) {
                  image = imageEl.src;
                }
                
                // Extract product URL - look for the most relevant link
                let url = '';
                // First try common product link patterns
                const linkEl = card.closest('a[href*="product"], a[href*="item"], a[href*="/p/"]') || 
                              card.querySelector('a[href*="product"], a[href*="item"], a[href*="/p/"]');
                
                if (linkEl && linkEl.href) {
                  // Make sure it's a valid URL and not a hash link
                  try {
                    const urlObj = new URL(linkEl.href, window.location.origin);
                    if (urlObj.pathname !== '/' && !urlObj.pathname.endsWith('#')) {
                      url = urlObj.toString();
                    }
                  } catch (e) {
                    console.warn('Invalid product URL:', linkEl.href);
                  }
                }
                
                // Enhanced stock status detection for Salla
                let inStock = 'غير متأكد';
                const cardText = (card.textContent || '').toLowerCase();
                const cardHtml = card.innerHTML.toLowerCase();
                
                console.log('Checking stock status for product:', name);
                console.log('Card text content:', cardText.substring(0, 200) + '...');
                
                // More comprehensive stock status indicators
                const stockIndicators = {
                  outOfStock: [
                    'out of stock', 'sold out', 'unavailable', 'non disponible', 'out-of-stock',
                    'نفذت الكمية', 'غير متوفر', 'غير متاح', 'نفذ من المخزون', 'إنتهى من المخزون',
                    'انتهى', 'تم البيع', 'غير متوفر حالياً', 'نفذت', 'إنتهت الكمية',
                    'outofstock', 'sold-out', 'out_of_stock', 'not in stock', 'out of inventory'
                  ],
                  inStock: [
                    'in stock', 'available', 'add to cart', 'add to basket', 'add to bag',
                    'أضف للسلة', 'أضف إلى السلة', 'أضف إلى العربة', 'أضف للعربة',
                    'متوفر', 'متاح', 'في المخزون', 'جاهز للشحن', 'متوفر للتوصيل',
                    'متوفر للطلب', 'اشتري الآن', 'أطلب الآن', 'إشتري الآن', 'أضف إلى السلة',
                    'instock', 'in-stock', 'in_stock', 'addtocart', 'add-to-cart', 'add_to_cart',
                    'add-to-bag', 'add_to_bag', 'add-to-basket', 'add_to_basket', 'buy now',
                    'shop now', 'order now', 'purchase', 'checkout', 'proceed to checkout'
                  ]
                };
                
                // Check for stock status in text content
                const isOutOfStock = stockIndicators.outOfStock.some(indicator => 
                  cardText.includes(indicator) || cardHtml.includes(indicator)
                );
                
                const isInStock = stockIndicators.inStock.some(indicator => 
                  cardText.includes(indicator) || cardHtml.includes(indicator)
                );
                
                // More comprehensive add to cart button detection
                const addToCartSelectors = [
                  // Common button classes and IDs
                  '.add-to-cart', '.add_to_cart', '.btn-cart', '.add-to-bag',
                  '.add-to-basket', '.addtocart', '.add-to-cart-button',
                  '.single_add_to_cart_button', '.add-to-cart-btn',
                  '.product-add-to-cart', '.add-to-cart-buttons',
                  '.add-to-cart-buttons .button', '.add-to-cart-buttons .btn-cart',
                  '.add-to-cart-buttons .btn-add', '.add-to-cart-buttons .btn-addtocart',
                  '.add-to-cart-buttons .btn-add-to-cart', '.add-to-cart-buttons .button-cart',
                  '.add-to-cart-buttons .btn', '.add-to-cart-buttons .button-primary',
                  '.btn-addtocart', '.button--add-to-cart', '.js-add-to-cart',
                  '.js-add-to-cart-button', '.js-add-to-cart-btn',
                  
                  // Salla specific
                  '.product-card__action', '.product-card__action .btn',
                  '.product-card__action .button', '.product-card__action--cart',
                  '.product-card__action--add-to-cart', '.product-card__action--addtocart',
                  '.product-card__action--add-to-bag', '.product-card__action--addtobag',
                  '.product-card__action--add-to-basket', '.product-card__action--addtobasket'
                ];
                
                // Check for add to cart buttons with more flexible matching
                const hasAddToCart = addToCartSelectors.some(selector => {
                  try {
                    const buttons = card.querySelectorAll(selector);
                    return Array.from(buttons).some(btn => {
                      if (!btn || !isVisible(btn)) return false;
                      
                      const isDisabled = btn.disabled || 
                                       btn.classList.contains('disabled') || 
                                       btn.matches('[disabled]') ||
                                       btn.getAttribute('aria-disabled') === 'true' ||
                                       window.getComputedStyle(btn).opacity < 0.5 ||
                                       window.getComputedStyle(btn).display === 'none';
                      
                      if (isDisabled) return false;
                      
                      // Check button text for stock indicators
                      const btnText = (btn.textContent || '').toLowerCase();
                      const isOutOfStockBtn = stockIndicators.outOfStock.some(indicator => 
                        btnText.includes(indicator)
                      );
                      
                      const isInStockBtn = stockIndicators.inStock.some(indicator => 
                        btnText.includes(indicator)
                      );
                      
                      if (isOutOfStockBtn) return false;
                      if (isInStockBtn) return true;
                      
                      // Default to true for buttons that don't have clear stock indicators
                      return true;
                    });
                  } catch (e) {
                    console.warn('Error checking button:', e);
                    return false;
                  }
                });
                
                // Determine stock status with priority to out of stock indicators
                if (isOutOfStock) {
                  inStock = 'غير متاح';
                } else if (isInStock || hasAddToCart) {
                  inStock = 'متاح';
                }
                
                // Additional check for product availability in data attributes
                if (inStock === 'غير متأكد') {
                  const dataAttributes = ['data-available', 'data-in-stock', 'data-stock', 'data-status'];
                  for (const attr of dataAttributes) {
                    const value = card.getAttribute(attr);
                    if (value) {
                      const val = value.toLowerCase();
                      if (val === 'true' || val === '1' || val === 'in-stock' || val === 'instock' || val === 'available') {
                        inStock = 'متاح';
                        break;
                      } else if (val === 'false' || val === '0' || val === 'out-of-stock' || val === 'outofstock' || val === 'unavailable') {
                        inStock = 'غير متاح';
                        break;
                      }
                    }
                  }
                }
                
                console.log(`Stock status for ${name}: ${inStock}`);
                
                // Add product to the list
                products.push({
                  name: name,
                  price: price,
                  image: image,
                  url: url,
                  in_stock: inStock
                });
                
                console.log(`Product ${products.length}:`, { name, price, inStock });
                
              } catch (e) {
                console.error('Error processing product card:', e);
              }
            });
            
            // Get category from breadcrumb (take last meaningful item)
            const breadcrumbEl = document.querySelector('.breadcrumb, [class*="breadcrumb"]');
            let category = null;
            if (breadcrumbEl) {
              const items = breadcrumbEl.textContent.split('\n')
                .map(s => s.trim())
                .filter(s => s && s !== 'keyboard_arrow_left' && s !== 'الرئيسية');
              category = items.length > 0 ? items[items.length - 2] || items[0] : null;
            }
            
            // Store all products in context
            if (products.length > 0) {
              console.log(`✅ Found ${products.length} valid products`);
              autoContext.products = products;
              autoContext.product_count = products.length;
              
              // Log first few products for debugging
              console.log('Sample products:', products.slice(0, 3).map(p => ({
                name: p.name,
                price: p.price,
                in_stock: p.in_stock
              })));
            } else {
              console.warn('⚠️ No valid products found after filtering');
              autoContext.products = []; // Use empty array instead of null
              autoContext.product_count = 0;
            }
            
            // For backward compatibility, maintain the product_info structure
            autoContext.product_info = {
              price: products[0]?.price || '',
              name: products.length > 1 ? `${products.length} منتجات` : (products[0]?.name || cleanText(document.querySelector('h1, .product-title, [class*="product-title"]')?.textContent) || 'منتج غير معروف'),
              category: category || 'فئة غير محددة',
              description: cleanText(document.querySelector('.product-description, [class*="description"]')?.textContent)?.substring(0, 200) || (products[0]?.description?.substring(0, 200) || ''),
              add_to_cart: products[0]?.in_stock || 'غير متاح'
            };
            
            // Store in window for agent to access
            window.__wosoolPageContext = autoContext;
            console.log('✅ Auto-context stored:', autoContext);
            
            // Optionally send to backend for logging
            fetch(`${BACKEND_URL}/api/webhooks/elevenlabs/tools/context-response`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                command_id: 'auto_' + Date.now(),
                context_data: autoContext
              })
            }).catch(() => {}); // Silent fail
          }
        }, 2000); // Wait 2 seconds for page to fully load
        
        // --- Branding Setup ---
        const fixBranding = () => { window.__wosoolQuickHide(); };
        for (let i = 0; i < 20; i++) { setTimeout(fixBranding, i * 200); }
        const brandingInterval = setInterval(fixBranding, 500);
        window.__wosoolBrandingInterval = brandingInterval;
        
        console.log('✅ Wosool widget initialization complete');
      };

      document.body.appendChild(script);
    } catch (error) {
      console.error('❌ Error loading widget or config:', error);
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('📱 Device:', isMobile ? 'Mobile' : 'Desktop');
      console.error('🌐 User Agent:', navigator.userAgent);
      
      // More specific error message
      let errorMsg = 'Wosool widget failed to load.';
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMsg = 'Network error. Please check your connection.';
      } else if (error.message.includes('HTTP')) {
        errorMsg = `Server error: ${error.message}`;
      }
      
      showNotification(errorMsg, 'error');
    }
  }

  // Load when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWidget);
  } else {
    loadWidget();
  }
})();