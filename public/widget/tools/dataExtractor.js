/**
 * Wosool Agent - Data Module (DataExtractor.js)
 * * المنهجية: الاستخراج المعتمد على القواعد (Rules-Based) لضمان التوسع والمرونة.
 * * التعديل الحاسم: تحديث محددات المنتجات لصفحات القوائم (Salla/E-commerce).
 * * @version 3.2
 */

class DataExtractor {
  constructor(config = {}) {
    this.config = {
      maxItems: 50,
      timeout: 10000,
      validateData: true,
      debugMode: false,
      ...config
    };
    this.extractionRules = this.initializeExtractionRules();
  }

  // ===== MAIN EXTRACTION METHOD - نقطة الدخول الرئيسية =====

  async extractPageData({ dataType, config: options = {} }) { 
    const startTime = performance.now();
    this.log(`📊 Extracting ${dataType}...`);
    try {
      const finalConfig = { ...this.config, ...options }; 
      
      const extractors = {
        products: () => this.extractProducts(finalConfig),
        categories: () => this.extractCategories(finalConfig),
        cart: () => this.extractCart(finalConfig),
        prices: () => this.extractPrices(finalConfig),
        all: () => this.extractAll(finalConfig), 
        product: () => this.extractProductDetail(finalConfig),
      };

      const extractor = extractors[dataType];
      if (!extractor) {
        throw new Error(
          `Unknown dataType: ${dataType}. Supported: ${Object.keys(extractors).join(', ')}`
        );
      }

      const result = extractor();
      const processingTime = Math.round(performance.now() - startTime);
      this.log(`✅ Extraction complete`, { dataType, count: result.itemCount || 0, processingTime });

      return {
        ...result,
        success: true,
        processingTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const processingTime = Math.round(performance.now() - startTime);
      this.log(`❌ Extraction failed:`, error.message);
      return {
        success: false,
        error: error.message,
        dataType,
        processingTime
      };
    }
  }

  // ===== EXTRACTION RULES - القواعد التفصيلية (تم التعديل هنا) =====

  initializeExtractionRules() {
    return {
      products: {
        // قائمة محددات الحاوية: تستهدف عنصر المنتج المنفرد (CRITICAL FIX)
        selectors: [
          '.s-product-item', // محدد قوي وشائع في Salla
          '.product-card-container',
          '[data-product-id]', 
          '.product-item', 
          '.product-card', 
          '[class*="product-wrapper"]',
          '[itemtype*="Product"]'
        ],
        fields: {
          id: { selectors: ['data-product-id', 'data-id', 'id'], attribute: 'id' },
          name: { selectors: ['.product-name', '.product-title', 'h2', 'h3', 'a'], type: 'string' },
          price: { selectors: ['.product-price', '.price', '[data-price]'], type: 'number' },
          image: { selectors: ['img'], attribute: 'src', type: 'string' },
          url: { selectors: ['a'], attribute: 'href', type: 'string' }
        }
      },
      categories: {
        selectors: ['.category-item', 'nav a[href*="/category/"]'],
        fields: {
          name: { selectors: ['.category-name', 'a'], type: 'string' },
          url: { selectors: ['a'], attribute: 'href', type: 'string' }
        }
      },
      cart: {
        selectors: ['.cart-item', '[data-cart-item]'],
        fields: {
          productId: { selectors: ['[data-product-id]'], attribute: 'data-product-id', type: 'string' },
          quantity: { selectors: ['.quantity-input', '[data-quantity]'], type: 'number' },
        }
      }
    };
  }
  
  // ===== CORE EXTRACTION LOGIC (التأكيد على التكرار) =====

  extractProducts(config) {
    const products = [];
    const rule = this.extractionRules.products;
    const maxItems = config.maxItems || this.config.maxItems; 

    // 1. استخدام querySelectorAll: يجب أن يجد كل بطاقات المنتج المنفردة الآن
    const productElements = document.querySelectorAll(rule.selectors.join(', '));
    
    productElements.forEach((el, index) => {
        if (index >= maxItems && maxItems !== Infinity) return; 

        if (this.isSkipElement(el)) return;

        const product = this.extractFields(el, rule.fields); 
        
        if (this.isValidProduct(product)) {
            products.push(product);
        }
    });

    this.log(`Extracted ${products.length} products.`, { maxItems, totalElements: productElements.length });
    return { data: products, itemCount: products.length, dataType: 'products' };
  }
  
  extractProductDetail(config) {
    // First try to get all products on the page (for product listing pages)
    const productsResult = this.extractProducts({ ...config, maxItems: config.maxItems || 50 });
    
    // If we found multiple products, return them
    if (productsResult.itemCount > 1) {
      return {
        ...productsResult,
        dataType: 'products',
        isList: true
      };
    }
    
    // If no products found in listing format, try to get single product details
    const rule = this.extractionRules.products;
    const productElement = document.querySelector(rule.selectors.join(', '));
    
    if (productElement) {
      const product = this.extractFields(productElement, rule.fields);
      if (this.isValidProduct(product)) {
        return { 
          data: product, 
          itemCount: 1, 
          dataType: 'product',
          isList: false
        };
      }
    }
    
    // If we have at least one product from the listing, return it
    if (productsResult.itemCount === 1) {
      return {
        ...productsResult,
        dataType: 'product',
        isList: false
      };
    }
    
    return { 
      data: null, 
      itemCount: 0, 
      dataType: 'product', 
      error: 'Product details not found.',
      isList: false
    };
  }

  // ... (احتفظ ببقية الدوال المساعدة مثل extractCategories, extractCart, extractFields, castValue, isValidProduct)
  extractCategories(config) {
    const categories = [];
    const rule = this.extractionRules.categories;
    const categoryElements = document.querySelectorAll(rule.selectors.join(', '));
    categoryElements.forEach((el) => {
        if (this.isSkipElement(el)) return;
        const category = this.extractFields(el, rule.fields); 
        categories.push(category);
    });
    return { data: categories, itemCount: categories.length, dataType: 'categories' };
  }
  
  extractCart(config) { /* ... */ return { data: [], itemCount: 0, dataType: 'cart' }; }
  extractPrices(config) { /* ... */ return { data: {}, itemCount: 0, dataType: 'prices' }; }
  extractAll(config) { 
    return {
      products: this.extractProducts(config),
      cart: this.extractCart(config),
      dataType: 'all'
    };
  }
  
  // دوال مساعدة
  extractFields(parentElement, fields) {
      const data = {};
      for (const [key, fieldRule] of Object.entries(fields)) {
          const selectors = Array.isArray(fieldRule.selectors) ? fieldRule.selectors : [fieldRule.selectors];
          const attribute = fieldRule.attribute;
          
          for (const selector of selectors) {
              if (selector.startsWith('data-') || selector === 'id') {
                  const value = parentElement.getAttribute(selector);
                  if (value) {
                      data[key] = this.castValue(value, fieldRule.type);
                      break; 
                  }
              }
              const element = parentElement.querySelector(selector);
              if (element) {
                  let value = attribute ? element.getAttribute(attribute) : element.textContent?.trim();
                  data[key] = this.castValue(value, fieldRule.type);
                  break; 
              }
          }
      }
      return data;
  }
  
  castValue(value, type) {
    if (!value) return null;
    if (type === 'number') {
        return parseFloat(String(value).replace(/[^0-9.]/g, '')) || null;
    }
    return String(value).trim().replace(/\s+/g, ' ');
  }

  isValidProduct(product) {
    if (this.config.validateData) {
      return product && product.name && product.price && product.name.trim().length > 0;
    }
    return true;
  }
  
  isSkipElement(el) {
    return el.classList.contains('header') || el.classList.contains('footer') || 
           (!el.textContent?.trim() && !el.querySelector('img'));
  }
  
  log(message, ...args) {
    if (this.config.debugMode) {
      console.log(`[DataExtractor] ${message}`, ...args);
    }
  }

}


// ===== الإتاحة العالمية (Global Export) =====

function extractPageData({ dataType, config }) {
  if (!window.__advancedDataExtractor) {
    window.__advancedDataExtractor = new DataExtractor({
      debugMode: false,
      enableValidation: true,
    });
  }
  return window.__advancedDataExtractor.extractPageData({ dataType, config }); 
}

if (typeof window !== 'undefined') {
  window.__dataExtractor = {
    extractPageData,
    extractProducts: (config) => extractPageData({ dataType: 'products', config }),
    extractCategories: (config) => extractPageData({ dataType: 'categories', config }),
    extractCart: (config) => extractPageData({ dataType: 'cart', config }),
  };
  
  if (!window.__advancedDataExtractor) {
    window.__advancedDataExtractor = new DataExtractor({
      debugMode: false,
      enableValidation: true,
    });
  }
}