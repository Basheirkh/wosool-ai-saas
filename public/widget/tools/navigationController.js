/**
 * Navigation Controller Tool
 * Handles navigation to categories, products, and other pages
 */
/*
// Assuming the parameter name in your widget settings is 'targetId'
// If it's 'identifier', change 'targetId' below back to 'identifier'.

// ----------------------------------------------------------------------
// FIX 1: Add default empty object to the parameter destructuring: = {}
// ----------------------------------------------------------------------
function navigateToPage(params = {}) {
  // DEBUG: Log what we received
  console.log('🔍 navigateToPage received params:', params);
  console.log('🔍 params.destination:', params.destination);
  console.log('🔍 params.targetId:', params.targetId);
  
  // Extract parameters - support both targetId and identifier for compatibility
  const destination = params.destination;
  const targetId = params.targetId || params.identifier;
  
  // ----------------------------------------------------------------------
  // CRITICAL FIX 2: Cast targetId to a safe string, defaulting to empty string.
  // This prevents the TypeError when calling .startsWith() on undefined.
  // ----------------------------------------------------------------------
  const safeIdentifier = targetId ? String(targetId) : '';

  // Use the safe destination variable, converting it to string/lowercase for consistency
  const safeDestination = String(destination || '').toLowerCase();

  // Basic validation for the destination type
  if (!safeDestination) {
    console.error('❌ Navigation error: Missing required parameter "destination".');
    return {
      success: false,
      error: 'Missing required navigation parameter "destination".'
    };
  }

  console.log('🧭 Navigation Controller: Navigating to:', safeDestination, safeIdentifier || '(No Identifier)');

  try {
    let url = null;
    
    switch (safeDestination) {
      case 'category':
        url = `/category/${encodeURIComponent(safeIdentifier)}`;
        break;
      case 'product':
        url = `/product/${encodeURIComponent(safeIdentifier)}`;
        break;
      case 'search':
        url = `/search?q=${encodeURIComponent(safeIdentifier)}`;
        break;
      case 'cart':
        url = '/cart';
        // Force a full page reload to ensure cart state is fresh
        if (window.location.pathname === '/cart') {
          window.location.reload();
          return { success: true, message: 'Refreshing cart page', url: '/cart' };
        }
        break;
      case 'home':
        url = '/';
        break;
        
      default:
        // Now safeIdentifier is guaranteed to be a string (even if empty)
        if (safeIdentifier.startsWith('http')) { 
          url = safeIdentifier;
        } else if (safeIdentifier) {
          // If identifier exists but is not a full URL, treat it as a path fragment.
          url = `/${encodeURIComponent(safeIdentifier)}`;
        } else {
          // If destination is unknown and identifier is missing, go to home.
          console.warn('⚠️ Navigation Controller: Unknown destination used without identifier. Redirecting to home.');
          url = '/';
        }
    }
    
    console.log('🔗 Redirecting to:', url);
    try {
      // Try standard navigation first
      window.location.href = url;
      
      // Fallback if navigation is blocked
      setTimeout(() => {
        if (window.location.href.indexOf(url) === -1) {
          console.warn('Standard navigation blocked, trying window.open');
          window.open(url, '_self');
        }
      }, 100);
    } catch (error) {
      console.error('Navigation error, trying alternative method:', error);
      window.open(url, '_self');
    }
    
    return {
      success: true,
      message: `Mapsd to ${safeDestination}`,
      url: url
    };
  } catch (error) {
    console.error('❌ Navigation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

if (typeof window !== 'undefined') {
  // Ensure the exported function uses the corrected internal logic
  window.__navigationController = { navigateToPage };
}

*/


/**
 * Advanced Navigation Controller Tool v3.0
 * Comprehensive navigation solution with intelligent routing, history management,
 * security features, and analytics integration for conversational AI agents
 * Following ElevenLabs client tools best practices
 */

class AdvancedNavigationController {
  constructor(config = {}) {
    this.config = {
      enableHistory: true,
      enableSecurityChecks: true,
      enableAnalytics: true,
      enablePreloading: true,
      enableValidation: true,
      maxHistorySize: 50,
      navigationTimeout: 10000,
      allowedDomains: [],
      blockedPaths: [],
      enableProgressTracking: true,
      enableFallbacks: true,
      enableDeepLinking: true,
      enableSEO: true,
      ...config
    };

    this.navigationHistory = [];
    this.navigationState = {
      currentUrl: window.location.href,
      previousUrl: null,
      navigationCount: 0,
      sessionStart: Date.now(),
      isNavigating: false
    };
    
    this.routeMap = new Map();
    this.fallbackRoutes = new Map();
    this.preloadCache = new Map();
    this.navigationListeners = new Set();
    
    this.initializeNavigationSystem();
    this.setupSecurityPolicies();
    this.registerDefaultRoutes();
  }

  async navigateToPage(params = {}) {
    const startTime = performance.now();
    const navigationId = `nav_${Date.now()}`;
    
    this.log('🧭 Navigation Controller: Starting navigation', { 
      params, 
      navigationId,
      currentUrl: window.location.href 
    });

    try {
      // Enhanced parameter extraction and validation
      const navigationRequest = this.parseNavigationParams(params);
      
      // Security validation
      if (this.config.enableSecurityChecks) {
        const securityCheck = await this.validateSecurity(navigationRequest);
        if (!securityCheck.allowed) {
          return {
            success: false,
            error: `Navigation blocked: ${securityCheck.reason}`,
            securityViolation: true,
            navigationId
          };
        }
      }

      // Pre-navigation checks
      const preNavigationChecks = await this.performPreNavigationChecks(navigationRequest);
      if (!preNavigationChecks.passed) {
        return {
          success: false,
          error: preNavigationChecks.error,
          checks: preNavigationChecks.failedChecks,
          navigationId
        };
      }

      // Build the target URL
      const urlResult = await this.buildTargetUrl(navigationRequest);
      if (!urlResult.success) {
        return {
          success: false,
          error: urlResult.error,
          navigationId,
          suggestions: urlResult.suggestions
        };
      }

      // Store current state before navigation
      this.storeNavigationState(navigationRequest, urlResult.url);

      // Perform navigation with progress tracking
      const navigationResult = await this.executeNavigation(urlResult.url, navigationRequest);
      
      const processingTime = Math.round(performance.now() - startTime);

      // Enhanced result with comprehensive metadata
      const result = {
        success: navigationResult.success,
        message: navigationResult.message,
        navigation: {
          from: this.navigationState.currentUrl,
          to: urlResult.url,
          destination: navigationRequest.destination,
          identifier: navigationRequest.identifier,
          method: navigationRequest.method || 'redirect',
          processingTime
        },
        metadata: {
          navigationId,
          timestamp: new Date().toISOString(),
          sessionNavigations: this.navigationState.navigationCount,
          historyLength: this.navigationHistory.length,
          userAgent: navigator.userAgent,
          referrer: document.referrer
        },
        analytics: this.config.enableAnalytics ? this.generateAnalytics(navigationRequest, navigationResult) : null
      };

      // Post-navigation tasks
      await this.performPostNavigationTasks(result);

      this.log('✅ Navigation completed successfully', { 
        navigationId, 
        processingTime, 
        destination: navigationRequest.destination 
      });

      return result;

    } catch (error) {
      const processingTime = Math.round(performance.now() - startTime);
      
      this.log('❌ Navigation failed', { 
        navigationId, 
        error: error.message, 
        processingTime 
      });

      return {
        success: false,
        error: error.message,
        errorType: error.name,
        navigationId,
        processingTime,
        timestamp: new Date().toISOString(),
        recovery: this.generateRecoveryOptions(params),
        fallback: await this.getFallbackRoute(params)
      };
    }
  }

  // ===== ENHANCED PARAMETER PARSING =====
  parseNavigationParams(params) {
    // Support multiple parameter formats for flexibility
    const destination = params.destination || params.page || params.route || params.target;
    const identifier = params.targetId || params.identifier || params.id || params.slug;
    const method = params.method || params.type || 'redirect';
    const options = params.options || {};

    // Advanced parameter extraction
    return {
      destination: this.sanitizeDestination(destination),
      identifier: this.sanitizeIdentifier(identifier),
      method: this.validateNavigationMethod(method),
      
      // Additional navigation options
      openInNewTab: options.newTab || options.blank || params.newTab || false,
      replace: options.replace || params.replace || false,
      preserveScroll: options.preserveScroll || params.preserveScroll || false,
      
      // Query parameters and fragments
      queryParams: options.queryParams || params.queryParams || {},
      fragment: options.fragment || params.fragment || null,
      
      // Navigation metadata
      source: params.source || 'conversational_ai',
      context: params.context || {},
      priority: params.priority || 'normal',
      
      // Tracking and analytics
      trackingId: params.trackingId || this.generateTrackingId(),
      campaign: params.campaign || null,
      referrer: params.referrer || 'agent_navigation'
    };
  }

  // ===== INTELLIGENT URL BUILDING =====
  async buildTargetUrl(navigationRequest) {
    try {
      const { destination, identifier, queryParams, fragment } = navigationRequest;
      
      // Route resolution with intelligent fallbacks
      let url = null;
      
      // Check registered routes first
      if (this.routeMap.has(destination)) {
        url = this.routeMap.get(destination)(identifier, navigationRequest);
      } else {
        // Built-in route handling with enhanced logic
        url = await this.resolveBuiltInRoute(destination, identifier, navigationRequest);
      }

      if (!url) {
        // Fallback route resolution
        url = await this.resolveFallbackRoute(destination, identifier, navigationRequest);
      }

      if (!url) {
        return {
          success: false,
          error: `Unable to resolve route for destination: ${destination}`,
          suggestions: this.generateRouteSuggestions(destination)
        };
      }

      // Enhance URL with query parameters and fragments
      const enhancedUrl = this.enhanceUrl(url, queryParams, fragment, navigationRequest);
      
      // URL validation and sanitization
      const validationResult = await this.validateUrl(enhancedUrl, navigationRequest);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error,
          suggestions: validationResult.suggestions
        };
      }

      return {
        success: true,
        url: enhancedUrl,
        resolvedVia: url.resolvedVia || 'built-in',
        metadata: {
          originalDestination: destination,
          resolvedPath: enhancedUrl,
          hasQueryParams: Object.keys(queryParams).length > 0,
          hasFragment: !!fragment
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `URL building failed: ${error.message}`,
        suggestions: ['Check destination format', 'Verify identifier validity', 'Review query parameters']
      };
    }
  }

  async resolveBuiltInRoute(destination, identifier, navigationRequest) {
    const routes = {
      category: (id) => `/category/${this.encodePathSegment(id)}`,
      product: (id) => `/product/${this.encodePathSegment(id)}`,
      search: (query) => `/search?q=${encodeURIComponent(query)}`,
      
      // Enhanced e-commerce routes
      cart: () => '/cart',
      checkout: () => '/checkout',
      account: (section) => section ? `/account/${this.encodePathSegment(section)}` : '/account',
      orders: (orderId) => orderId ? `/orders/${this.encodePathSegment(orderId)}` : '/orders',
      wishlist: () => '/wishlist',
      
      // Content pages
      home: () => '/',
      about: () => '/about',
      contact: () => '/contact',
      help: (topic) => topic ? `/help/${this.encodePathSegment(topic)}` : '/help',
      faq: () => '/faq',
      
      // User pages
      login: () => '/login',
      register: () => '/register',
      profile: () => '/profile',
      settings: (section) => section ? `/settings/${this.encodePathSegment(section)}` : '/settings',
      
      // Advanced routing
      brand: (brandId) => `/brand/${this.encodePathSegment(brandId)}`,
      collection: (collectionId) => `/collection/${this.encodePathSegment(collectionId)}`,
      sale: (saleId) => saleId ? `/sale/${this.encodePathSegment(saleId)}` : '/sale',
      blog: (slug) => slug ? `/blog/${this.encodePathSegment(slug)}` : '/blog',
      
      // External and special routes
      external: (url) => this.validateExternalUrl(url),
      tel: (phone) => `tel:${this.sanitizePhoneNumber(phone)}`,
      mailto: (email) => `mailto:${this.sanitizeEmail(email)}`,
      
      // Dynamic routing with pattern matching
      dynamic: (pattern) => this.resolveDynamicRoute(pattern, navigationRequest)
    };

    const routeHandler = routes[destination];
    if (!routeHandler) {
      return null;
    }

    try {
      const resolvedUrl = routeHandler(identifier);
      return resolvedUrl ? { 
        url: resolvedUrl, 
        resolvedVia: 'built-in',
        handler: destination 
      } : null;
    } catch (error) {
      this.log(`⚠️ Route resolution failed for ${destination}:`, error.message);
      return null;
    }
  }

  // ===== NAVIGATION EXECUTION =====
  async executeNavigation(url, navigationRequest) {
    try {
      this.navigationState.isNavigating = true;
      
      // Pre-navigation hooks
      await this.triggerNavigationEvent('beforeNavigate', { url, request: navigationRequest });
      
      // Progress tracking
      if (this.config.enableProgressTracking) {
        this.startProgressTracking(navigationRequest.trackingId);
      }

      let navigationMethod;
      
      if (navigationRequest.openInNewTab) {
        // Open in new tab/window
        navigationMethod = 'newTab';
        const windowFeatures = this.buildWindowFeatures(navigationRequest);
        const newWindow = window.open(url, '_blank', windowFeatures);
        
        if (!newWindow) {
          throw new Error('Popup blocked or failed to open new window');
        }
        
        // Monitor new window if possible
        if (this.config.enableAnalytics) {
          this.trackNewWindowOpen(url, navigationRequest);
        }
        
      } else if (navigationRequest.replace) {
        // Replace current history entry
        navigationMethod = 'replace';
        window.location.replace(url);
        
      } else {
        // Standard navigation
        navigationMethod = 'redirect';
        
        // Optional: Add navigation delay for user experience
        if (navigationRequest.delay && navigationRequest.delay > 0) {
          await this.sleep(navigationRequest.delay);
        }
        
        window.location.href = url;
      }
      
      // Update navigation state
      this.updateNavigationMetrics(url, navigationMethod, navigationRequest);
      
      // Post-navigation hooks
      await this.triggerNavigationEvent('afterNavigate', { 
        url, 
        method: navigationMethod, 
        request: navigationRequest 
      });

      return {
        success: true,
        message: `Successfully navigated to ${navigationRequest.destination}`,
        method: navigationMethod,
        url: url
      };

    } catch (error) {
      this.navigationState.isNavigating = false;
      
      // Error recovery
      const recovery = await this.attemptNavigationRecovery(url, navigationRequest, error);
      if (recovery.success) {
        return recovery;
      }
      
      throw new Error(`Navigation execution failed: ${error.message}`);
      
    } finally {
      this.navigationState.isNavigating = false;
      
      if (this.config.enableProgressTracking) {
        this.stopProgressTracking(navigationRequest.trackingId);
      }
    }
  }

  // ===== SECURITY AND VALIDATION =====
  async validateSecurity(navigationRequest) {
    try {
      const { destination, identifier } = navigationRequest;
      
      // Domain whitelist check
      if (this.config.allowedDomains.length > 0) {
        const isAllowedDomain = await this.checkDomainWhitelist(identifier, destination);
        if (!isAllowedDomain.allowed) {
          return {
            allowed: false,
            reason: `Domain not in allowlist: ${isAllowedDomain.domain}`,
            violationType: 'domain_restriction'
          };
        }
      }
      
      // Blocked paths check
      if (this.config.blockedPaths.length > 0) {
        const isBlockedPath = this.checkBlockedPaths(identifier, destination);
        if (isBlockedPath.blocked) {
          return {
            allowed: false,
            reason: `Path is blocked: ${isBlockedPath.path}`,
            violationType: 'path_restriction'
          };
        }
      }
      
      // XSS and injection prevention
      const xssCheck = this.checkForXSS(identifier);
      if (xssCheck.detected) {
        return {
          allowed: false,
          reason: 'Potential XSS detected in navigation parameters',
          violationType: 'xss_prevention',
          details: xssCheck.details
        };
      }
      
      // URL scheme validation
      if (identifier && typeof identifier === 'string') {
        const schemeCheck = this.validateUrlScheme(identifier);
        if (!schemeCheck.valid) {
          return {
            allowed: false,
            reason: `Invalid or dangerous URL scheme: ${schemeCheck.scheme}`,
            violationType: 'scheme_restriction'
          };
        }
      }

      return { allowed: true };
      
    } catch (error) {
      return {
        allowed: false,
        reason: `Security validation error: ${error.message}`,
        violationType: 'validation_error'
      };
    }
  }

  // ===== ANALYTICS AND TRACKING =====
  generateAnalytics(navigationRequest, navigationResult) {
    return {
      navigationId: navigationRequest.trackingId,
      source: navigationRequest.source,
      destination: navigationRequest.destination,
      success: navigationResult.success,
      method: navigationResult.method,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      
      // User journey tracking
           // User journey tracking
      sessionData: {
        navigationCount: this.navigationState.navigationCount,
        sessionDuration: Date.now() - this.navigationState.sessionStart,
        previousUrl: this.navigationState.previousUrl,
        referrer: document.referrer
      },
      
      // Performance metrics
      performance: {
        processingTime: navigationResult.processingTime,
        pageLoadStart: performance.now(),
        navigationTiming: this.getNavigationTiming()
      },
      
      // Context data
      context: {
        viewport: this.getViewportInfo(),
        device: this.getDeviceInfo(),
        connection: this.getConnectionInfo(),
        pageContext: this.getCurrentPageContext()
      },
      
      // Conversion funnel tracking
      funnelData: {
        step: this.determineFunnelStep(navigationRequest.destination),
        previousStep: this.getPreviousFunnelStep(),
        conversionPath: this.getConversionPath()
      }
    };
  }

  // ===== ADVANCED FEATURES =====
  
  // Route Registration System
  registerRoute(destination, handler, options = {}) {
    this.routeMap.set(destination, (identifier, request) => {
      try {
        const result = handler(identifier, request);
        return {
          url: result,
          resolvedVia: 'custom',
          handler: destination,
          options: options
        };
      } catch (error) {
        this.log(`❌ Custom route handler failed for ${destination}:`, error.message);
        return null;
      }
    });
    
    // Register fallback if provided
    if (options.fallback) {
      this.fallbackRoutes.set(destination, options.fallback);
    }
    
    this.log(`✅ Registered custom route: ${destination}`);
  }

  // Batch Navigation Support
  async navigateBatch(navigationRequests, options = {}) {
    const batchId = `batch_${Date.now()}`;
    const results = [];
    
    this.log(`🔄 Starting batch navigation`, { batchId, count: navigationRequests.length });
    
    try {
      const batchOptions = {
        sequential: options.sequential || false,
        stopOnError: options.stopOnError || false,
        delay: options.delay || 0,
        ...options
      };
      
      if (batchOptions.sequential) {
        // Execute navigations sequentially
        for (let i = 0; i < navigationRequests.length; i++) {
          const request = navigationRequests[i];
          
          try {
            const result = await this.navigateToPage(request);
            results.push({ index: i, request, result });
            
            if (!result.success && batchOptions.stopOnError) {
              break;
            }
            
            if (batchOptions.delay > 0 && i < navigationRequests.length - 1) {
              await this.sleep(batchOptions.delay);
            }
            
          } catch (error) {
            results.push({ 
              index: i, 
              request, 
              result: { success: false, error: error.message } 
            });
            
            if (batchOptions.stopOnError) {
              break;
            }
          }
        }
      } else {
        // Execute navigations in parallel
        const promises = navigationRequests.map((request, index) => 
          this.navigateToPage(request)
            .then(result => ({ index, request, result }))
            .catch(error => ({ 
              index, 
              request, 
              result: { success: false, error: error.message } 
            }))
        );
        
        const parallelResults = await Promise.allSettled(promises);
        results.push(...parallelResults.map(r => r.status === 'fulfilled' ? r.value : r.reason));
      }
      
      const successCount = results.filter(r => r.result.success).length;
      
      return {
        success: successCount > 0,
        batchId,
        totalRequests: navigationRequests.length,
        successfulNavigations: successCount,
        failedNavigations: results.length - successCount,
        results: results,
        executionMode: batchOptions.sequential ? 'sequential' : 'parallel'
      };
      
    } catch (error) {
      return {
        success: false,
        batchId,
        error: error.message,
        results: results
      };
    }
  }

  // Smart URL Preloading
  async preloadUrls(destinations, options = {}) {
    const preloadId = `preload_${Date.now()}`;
    const results = [];
    
    this.log(`🚀 Starting URL preloading`, { preloadId, count: destinations.length });
    
    try {
      for (const destination of destinations) {
        try {
          const urlResult = await this.buildTargetUrl(destination);
          if (urlResult.success) {
            await this.preloadUrl(urlResult.url, options);
            results.push({ destination, success: true, url: urlResult.url });
            this.preloadCache.set(destination.destination, urlResult.url);
          } else {
            results.push({ destination, success: false, error: urlResult.error });
          }
        } catch (error) {
          results.push({ destination, success: false, error: error.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        preloadId,
        preloadedUrls: successCount,
        totalRequests: destinations.length,
        results: results
      };
      
    } catch (error) {
      return {
        success: false,
        preloadId,
        error: error.message,
        results: results
      };
    }
  }

  async preloadUrl(url, options = {}) {
    const link = document.createElement('link');
    link.rel = options.prefetch ? 'prefetch' : 'preload';
    link.href = url;
    link.as = options.as || 'document';
    
    if (options.crossorigin) {
      link.crossOrigin = options.crossorigin;
    }
    
    document.head.appendChild(link);
    
    return new Promise((resolve) => {
      link.onload = () => resolve(true);
      link.onerror = () => resolve(false);
      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }

  // Navigation History Management
  getNavigationHistory(options = {}) {
    const limit = options.limit || this.config.maxHistorySize;
    const includeAnalytics = options.includeAnalytics || false;
    
    return {
      success: true,
      history: this.navigationHistory.slice(-limit).map(entry => ({
        ...entry,
        analytics: includeAnalytics ? entry.analytics : undefined
      })),
      currentUrl: this.navigationState.currentUrl,
      sessionMetrics: {
        totalNavigations: this.navigationState.navigationCount,
        sessionDuration: Date.now() - this.navigationState.sessionStart,
        averageNavigationTime: this.calculateAverageNavigationTime()
      }
    };
  }

  // Breadcrumb Generation
  generateBreadcrumbs(options = {}) {
    const maxItems = options.maxItems || 5;
    const includeCurrent = options.includeCurrent !== false;
    
    const breadcrumbs = [];
    const recentHistory = this.navigationHistory.slice(-maxItems);
    
    // Add history items
    recentHistory.forEach((entry, index) => {
      breadcrumbs.push({
        label: entry.destination || this.extractPageTitle(entry.url),
        url: entry.url,
        position: index + 1,
        isCurrent: false
      });
    });
    
    // Add current page if requested
    if (includeCurrent) {
      breadcrumbs.push({
        label: document.title || 'Current Page',
        url: window.location.href,
        position: breadcrumbs.length + 1,
        isCurrent: true
      });
    }
    
    return {
      success: true,
      breadcrumbs: breadcrumbs,
      totalItems: breadcrumbs.length
    };
  }

  // Navigation Performance Monitoring
  getNavigationMetrics() {
    const history = this.navigationHistory;
    const totalNavigations = history.length;
    
    if (totalNavigations === 0) {
      return {
        success: true,
        metrics: {
          totalNavigations: 0,
          message: 'No navigation data available'
        }
      };
    }
    
    const successfulNavigations = history.filter(n => n.success).length;
    const averageTime = history.reduce((sum, n) => sum + (n.processingTime || 0), 0) / totalNavigations;
    const errorRate = ((totalNavigations - successfulNavigations) / totalNavigations) * 100;
    
    // Destination analysis
    const destinationStats = {};
    history.forEach(nav => {
      const dest = nav.destination || 'unknown';
      destinationStats[dest] = (destinationStats[dest] || 0) + 1;
    });
    
    return {
      success: true,
      metrics: {
        totalNavigations,
        successfulNavigations,
        failedNavigations: totalNavigations - successfulNavigations,
        successRate: (successfulNavigations / totalNavigations) * 100,
        errorRate,
        averageProcessingTime: Math.round(averageTime),
        destinationBreakdown: destinationStats,
        sessionDuration: Date.now() - this.navigationState.sessionStart,
        navigationVelocity: this.calculateNavigationVelocity()
      }
    };
  }

  // ===== UTILITY METHODS =====
  
  sanitizeDestination(destination) {
    if (!destination) return null;
    return String(destination).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
  }

  sanitizeIdentifier(identifier) {
    if (!identifier) return '';
    return String(identifier).trim();
  }

  encodePathSegment(segment) {
    if (!segment) return '';
    return encodeURIComponent(String(segment));
  }

  generateTrackingId() {
    return `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, data = {}) {
    if (this.config.debugMode) {
      console.log(`[NavigationController] ${message}`, data);
    }
  }

  // ===== INITIALIZATION =====
  
  initializeNavigationSystem() {
    // Set up page visibility change listener
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handlePageVisible();
      }
    });

    // Set up beforeunload listener
    window.addEventListener('beforeunload', (event) => {
      this.handleBeforeUnload(event);
    });

    // Set up popstate listener for history changes
    window.addEventListener('popstate', (event) => {
      this.handlePopState(event);
    });

    this.log('✅ Navigation system initialized');
  }

  setupSecurityPolicies() {
    // Set up default security policies
    if (this.config.enableSecurityChecks) {
      this.securityPolicies = {
        allowedSchemes: ['http:', 'https:', 'mailto:', 'tel:'],
        blockedPatterns: [
          /javascript:/i,
          /data:/i,
          /vbscript:/i,
          /<script/i,
          /on\w+\s*=/i
        ],
        maxUrlLength: 2048
      };
    }
  }

  registerDefaultRoutes() {
    // Register common fallback routes
    this.fallbackRoutes.set('category', '/categories');
    this.fallbackRoutes.set('product', '/products');
    this.fallbackRoutes.set('search', '/search');
    this.fallbackRoutes.set('unknown', '/');
  }
}

// ===== GLOBAL NAVIGATION FUNCTIONS =====

// Enhanced navigation function with comprehensive error handling
async function navigateToPage(params = {}) {
  // Handle direct URL navigation (from the widget)
  if (params.url) {
    try {
      console.log('🔗 Direct URL navigation to:', params.url);
      
      // Normalize the URL
      const targetUrl = new URL(params.url, window.location.origin);
      const currentUrl = new URL(window.location.href);
      
      // Special handling for cart page
      if (targetUrl.pathname.endsWith('/cart') || params.url.includes('/cart')) {
        console.log('🛒 Cart navigation detected');
        
        // If already on cart page, force reload
        if (currentUrl.pathname.endsWith('/cart')) {
          console.log('🔄 Already on cart page, forcing refresh');
          window.location.reload();
          return { success: true, message: 'Refreshing cart page', url: targetUrl.toString() };
        }
        
        // Try standard navigation first
        try {
          window.location.href = targetUrl.toString();
          
          // Fallback if navigation is blocked
          setTimeout(() => {
            if (!window.location.href.endsWith('/cart')) {
              console.warn('Standard navigation blocked, trying window.open');
              window.open(targetUrl.toString(), params.target || '_self');
            }
          }, 100);
          
          return { success: true, message: 'Navigating to cart', url: targetUrl.toString() };
          
        } catch (navError) {
          console.warn('Primary navigation failed, trying alternative:', navError);
          window.open(targetUrl.toString(), params.target || '_self');
          return { success: true, message: 'Used fallback navigation to cart', url: targetUrl.toString() };
        }
      }
      
      // For non-cart URLs, use standard navigation
      window.location.href = targetUrl.toString();
      
      return { success: true, message: `Navigated to ${targetUrl.toString()}`, url: targetUrl.toString() };
      
    } catch (error) {
      console.error('❌ Navigation failed, trying final fallback:', error);
      // Last resort - try window.open directly
      try {
        window.open(params.url, params.target || '_self');
        return { success: true, message: 'Used final fallback navigation', url: params.url };
      } catch (finalError) {
        console.error('❌ All navigation attempts failed:', finalError);
        return { 
          success: false, 
          error: `Navigation failed: ${finalError.message}`,
          details: {
            originalUrl: params.url,
            error: finalError.toString()
          }
        };
      }
    }
  }
  
  // Handle navigation by destination and identifier
  try {
    // Initialize global navigator if not exists
    if (!window.__advancedNavigator) {
      window.__advancedNavigator = new AdvancedNavigationController({
        debugMode: true,
        enableAnalytics: true,
        enableSecurityChecks: true
      });
    }

    return await window.__advancedNavigator.navigateToPage(params);
    
  } catch (error) {
    console.error('❌ Navigation system error:', error);
    
    // Fallback to simple navigation
    try {
      const destination = params.destination;
      const identifier = params.targetId || params.identifier;
      
      let url = '/';
      if (destination === 'category' && identifier) {
        url = `/category/${encodeURIComponent(identifier)}`;
      } else if (destination === 'product' && identifier) {
        url = `/product/${encodeURIComponent(identifier)}`;
      } else if (destination === 'search' && identifier) {
        url = `/search?q=${encodeURIComponent(identifier)}`;
      } else if (destination === 'cart') {
        url = '/cart';
        // Force a full page reload to ensure cart state is fresh
        if (window.location.pathname === '/cart') {
          window.location.reload();
          return { success: true, message: 'Refreshing cart page', url: '/cart' };
        }
      } else if (destination === 'home') {
        url = '/';
      }
      
      console.log('🔗 Fallback navigation to:', url);
      
      // Try standard navigation first
      window.location.href = url;
      
      // Fallback if navigation is blocked
      setTimeout(() => {
        if (window.location.href.indexOf(url) === -1) {
          console.warn('Standard navigation blocked, trying window.open');
          window.open(url, '_self');
        }
      }, 100);
      
      return {
        success: true,
        message: `Navigated to ${destination}`,
        url: url,
        fallback: true
      };
      
    } catch (fallbackError) {
      console.error('❌ Fallback navigation failed:', fallbackError);
      return {
        success: false,
        error: `Navigation failed: ${fallbackError.message}`,
        fallbackFailed: true
      };
    }
  }
}

// Batch navigation function
async function navigateBatch(requests, options = {}) {
  if (!window.__advancedNavigator) {
    window.__advancedNavigator = new AdvancedNavigationController();
  }
  
  return await window.__advancedNavigator.navigateBatch(requests, options);
}

// Preload URLs function
async function preloadNavigationUrls(destinations, options = {}) {
  if (!window.__advancedNavigator) {
    window.__advancedNavigator = new AdvancedNavigationController();
  }
  
  return await window.__advancedNavigator.preloadUrls(destinations, options);
}

// Get navigation history
function getNavigationHistory(options = {}) {
  if (!window.__advancedNavigator) {
    return { success: false, error: 'Navigation system not initialized' };
  }
  
  return window.__advancedNavigator.getNavigationHistory(options);
}

// Get navigation metrics
function getNavigationMetrics() {
  if (!window.__advancedNavigator) {
    return { success: false, error: 'Navigation system not initialized' };
  }
  
  return window.__advancedNavigator.getNavigationMetrics();
}

// Export functions for global use
if (typeof window !== 'undefined') {
  window.__navigationController = {
    navigateToPage,
    navigateBatch,
    preloadNavigationUrls,
    getNavigationHistory,
    getNavigationMetrics,
    
    // Advanced features
    registerRoute: (destination, handler, options) => {
      if (!window.__advancedNavigator) {
        window.__advancedNavigator = new AdvancedNavigationController();
      }
      return window.__advancedNavigator.registerRoute(destination, handler, options);
    },
    
    generateBreadcrumbs: (options) => {
      if (!window.__advancedNavigator) {
        window.__advancedNavigator = new AdvancedNavigationController();
      }
      return window.__advancedNavigator.generateBreadcrumbs(options);
    }
  };
  
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!window.__advancedNavigator) {
        window.__advancedNavigator = new AdvancedNavigationController();
      }
    });
  } else if (!window.__advancedNavigator) {
    window.__advancedNavigator = new AdvancedNavigationController();
  }
}
