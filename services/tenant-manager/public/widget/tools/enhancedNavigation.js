/**
 * Enhanced Navigation Controller with Post-Navigation Content Extraction
 * @file enhancedNavigation.js
 * * * التعديل الحاسم: تحديث محددات الانتظار لتتوافق مع محددات المنتجات المنفردة.
 * * @version 3.2
 */

// --- الدوال المساعدة الأساسية ---

async function waitForContent(selectors, timeout = 10000) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
        const check = () => {
            const contentReady = selectors.some(selector => 
                document.querySelectorAll(selector).length > 0
            );
            
            if (contentReady) {
                console.log(`✅ Content found after ${Date.now() - startTime}ms.`);
                resolve(true);
            } else if (Date.now() - startTime > timeout) {
                console.warn(`❌ Timeout: Content did not appear after ${timeout}ms.`);
                resolve(false);
            } else {
                setTimeout(check, 500); 
            }
        };
        check();
    });
}

function detectExtractionType() {
  const pathname = window.location.pathname.toLowerCase();
  
  if (pathname.includes('/product/')) return 'product';
  if (pathname.includes('/category/') || pathname.includes('/list')) return 'products';
  if (pathname.includes('search')) return 'products';
  if (pathname.includes('cart') || pathname.includes('basket')) return 'cart';
  
  return 'all';
}

// --- دالة الاستخراج بعد الملاحة (الحل النهائي) ---

async function extractAfterNavigation(options = {}) {
    // محددات انتظار مُحسَّنة لتستهدف عناصر المنتج المنفردة
    const defaultSelectors = [
        '.s-product-item', // محدد قوي
        '.product-card-container',
        '[data-product-id]', 
        '.product-details', 
        '.product-item', 
        'h1'
    ];
    
    const selectorsToWait = options.waitForSelectors || defaultSelectors;
    const timeout = options.timeout || 10000;

    console.log(`⌛ Enhanced Extractor: Waiting for content (${selectorsToWait.join(', ')})`);

    const contentFound = await waitForContent(selectorsToWait, timeout);

    if (!contentFound) {
        return {
            success: false,
            error: `Timeout: Dynamic content did not load after ${timeout / 1000} seconds.`,
            suggestion: 'The page content did not appear within the specified timeout. It might be a slow-loading page or an SPA transition issue.'
        };
    }
    
    console.log('✅ Content found. Starting deep extraction...');

    try {
        if (typeof window.__dataExtractor?.extractPageData !== 'function') {
            return {
                success: false,
                error: 'Data Extractor is not properly initialized or updated. Cannot perform deep extraction.'
            };
        }

        const extractionType = options.dataType || detectExtractionType();

        // 2. ضمان استدعاء dataExtractor بـ Infinity
        const result = await window.__dataExtractor.extractPageData({ 
            dataType: extractionType, 
            config: { 
                maxItems: options.maxItems === undefined ? Infinity : options.maxItems, 
                validateData: true,
                ...options 
            }
        });

        if (result.success && (result.itemCount === 0 && !result.data?.name)) {
            return {
                ...result,
                success: false,
                error: 'Extraction succeeded after waiting, but returned no valid data (0 useful items found).'
            };
        }
        
        return result;

    } catch (error) {
        return { success: false, error: `Extraction error after wait: ${error.message}` };
    }
}

// --- دالة الملاحة والاستخراج الموحدة (للتكامل) ---

async function navigateAndExtract(params = {}) {
    let navigationResult = { success: true, message: `Simulated navigation to ${params.destination}` };
    
    if (typeof window.__navigationController?.navigateToPage === 'function') {
        navigationResult = await window.__navigationController.navigateToPage(params);
    } else {
        console.warn('⚠️ Base navigationController not found. Simulating navigation.');
    }

    if (navigationResult.success) {
        const extractionResult = await extractAfterNavigation(params.extractionOptions || {});
        return {
            ...navigationResult,
            extraction: extractionResult,
            contentReady: extractionResult.success
        };
    }
    
    return navigationResult;
}


// --- إتاحة الدوال على المستوى العالمي ---

if (typeof window !== 'undefined') {
    if (!window.__navigationController) {
        window.__navigationController = {};
    }

    window.__navigationController = {
        ...window.__navigationController,
        waitForContent,
        extractAfterNavigation,
        navigateAndExtract,
    };
    
    console.log('✅ Enhanced Navigation Controller (Dynamic Content Solution) is loaded.');
}