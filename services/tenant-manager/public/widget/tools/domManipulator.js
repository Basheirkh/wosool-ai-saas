/**
 * DOM Manipulator Tool
 * Handles page manipulation like scrolling and highlighting
 */
/**
 
function manipulatePage({ action, target, value }) {
  console.log('📜 DOM Manipulator: Action', action, 'Target', target, 'Value', value);
  
  try {
    switch (action) {
      case 'scroll':
        return handleScroll(target, value);
      case 'highlight':
        return handleHighlight(target);
      case 'click':
        return handleClick(target);
      case 'focus':
        return handleFocus(target);
      default:
        return {
          success: false,
          error: `Unknown action: ${action}`
        };
    }
  } catch (error) {
    console.error('❌ DOM manipulation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function handleScroll(target, value) {
  try {
    if (target === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return { success: true, message: 'Scrolled to top' };
    }
    
    if (target === 'bottom') {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      return { success: true, message: 'Scrolled to bottom' };
    }
    
    if (target === 'percent') {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const targetScroll = (scrollHeight * value) / 100;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      return { success: true, message: `Scrolled to ${value}%` };
    }
    
    const element = document.querySelector(target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return { success: true, message: `Scrolled to element: ${target}` };
    }
    
    return { success: false, error: 'Target not found' };
  } catch (error) {
    console.error('❌ Scroll error:', error);
    return { success: false, error: error.message };
  }
}

function handleHighlight(selector) {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, error: 'Element not found' };
    }
    
    element.classList.add('wosool-highlight');
    
    if (!document.querySelector('#wosool-highlight-style')) {
      const style = document.createElement('style');
      style.id = 'wosool-highlight-style';
      style.textContent = `
        .wosool-highlight {
          animation: wosool-pulse 2s infinite;
          box-shadow: 0 0 20px rgba(21, 93, 253, 0.6) !important;
        }
        @keyframes wosool-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(21, 93, 253, 0.6); }
          50% { box-shadow: 0 0 30px rgba(21, 93, 253, 1); }
        }
      `;
      document.head.appendChild(style);
    }
    
    setTimeout(() => {
      element.classList.remove('wosool-highlight');
    }, 3000);
    
    return { success: true, message: `Highlighted: ${selector}` };
  } catch (error) {
    console.error('❌ Highlight error:', error);
    return { success: false, error: error.message };
  }
}

function handleClick(selector) {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, error: 'Element not found' };
    }
    
    element.click();
    return { success: true, message: `Clicked: ${selector}` };
  } catch (error) {
    console.error('❌ Click error:', error);
    return { success: false, error: error.message };
  }
}

function handleFocus(selector) {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, error: 'Element not found' };
    }
    
    element.focus();
    return { success: true, message: `Focused: ${selector}` };
  } catch (error) {
    console.error('❌ Focus error:', error);
    return { success: false, error: error.message };
  }
}

if (typeof window !== 'undefined') {
  window.__domManipulator = { manipulatePage };
}
*/

/**
 * Advanced DOM Manipulator Tool v3.0
 * Complete DOM manipulation solution with form handling, keyboard events, element creation,
 * batch operations, advanced waiting mechanisms, and comprehensive analytics
 * Following ElevenLabs client tools standards for conversational AI integration
 */

class AdvancedDOMManipulator {
  constructor(config = {}) {
    this.config = {
      animationDuration: 3000,
      highlightColor: '#155DFD',
      scrollBehavior: 'smooth',
      enableAnalytics: true,
      enableAccessibility: true,
      debounceDelay: 100,
      maxRetries: 3,
      timeout: 10000,
      batchTimeout: 15000,
      waitTimeout: 30000,
      enableSafeMode: true,
      enableUndo: true,
      ...config
    };
    
    this.activeHighlights = new Set();
    this.animationQueue = [];
    this.intersectionObserver = null;
    this.mutationObserver = null;
    this.undoStack = [];
    this.redoStack = [];
    this.eventListeners = new Map();
    this.formStates = new Map();
    this.elementCache = new Map();
    
    this.initializeObservers();
    this.injectStyles();
    this.setupGlobalEventHandlers();
  }

  async manipulatePage({ action, target, value, options = {} }) {
    const startTime = performance.now();
    const manipulationId = `${action}_${Date.now()}`;
    
    this.log(`🎯 DOM Manipulator: Starting ${action}`, { 
      target, 
      value, 
      manipulationId,
      options 
    });

    try {
      // Input validation
      if (!action || typeof action !== 'string') {
        throw new ValidationError('Action parameter is required and must be a string');
      }

      const finalConfig = { ...this.config, ...options };
      
      // Enhanced action registry with all capabilities
      const actions = {
        // Core DOM operations
        scroll: () => this.handleScroll(target, value, finalConfig),
        highlight: () => this.handleHighlight(target, finalConfig),
        click: () => this.handleClick(target, finalConfig),
        focus: () => this.handleFocus(target, finalConfig),
        hover: () => this.handleHover(target, finalConfig),
        show: () => this.handleShow(target, finalConfig),
        hide: () => this.handleHide(target, finalConfig),
        
        // Advanced operations
        animate: () => this.handleAnimate(target, value, finalConfig),
        measure: () => this.handleMeasure(target, finalConfig),
        validate: () => this.handleValidate(target, value, finalConfig),
        
        // Form operations
        fillForm: () => this.handleFormFill(target, value, finalConfig),
        submitForm: () => this.handleFormSubmit(target, finalConfig),
        resetForm: () => this.handleFormReset(target, finalConfig),
        selectOption: () => this.handleSelectOption(target, value, finalConfig),
        uploadFile: () => this.handleFileUpload(target, value, finalConfig),
        
        // Keyboard operations
        keyboard: () => this.handleKeyboard(target, value, finalConfig),
        type: () => this.handleType(target, value, finalConfig),
        keySequence: () => this.handleKeySequence(target, value, finalConfig),
        
        // Element creation/modification
        create: () => this.handleCreate(target, value, finalConfig),
        modify: () => this.handleModify(target, value, finalConfig),
        remove: () => this.handleRemove(target, finalConfig),
        clone: () => this.handleClone(target, value, finalConfig),
        
        // Advanced waiting
        waitForElement: () => this.waitForElement(target, finalConfig),
        waitForCondition: () => this.waitForCondition(target, value, finalConfig),
        waitForNavigation: () => this.waitForNavigation(finalConfig),
        waitForPageLoad: () => this.waitForPageLoad(finalConfig),
        
        // Batch operations
        batch: () => this.handleBatch(target, finalConfig),
        sequence: () => this.handleSequence(target, finalConfig),
        
        // Analysis and debugging
        analyze: () => this.handleAnalyze(target, finalConfig),
        debug: () => this.handleDebug(target, finalConfig),
        
        // Drag and drop
        drag: () => this.handleDrag(target, value, finalConfig),
        drop: () => this.handleDrop(target, value, finalConfig),
        
        // Clipboard operations
        copy: () => this.handleCopy(target, finalConfig),
        paste: () => this.handlePaste(target, value, finalConfig),
        
        // Undo/Redo
        undo: () => this.handleUndo(finalConfig),
        redo: () => this.handleRedo(finalConfig),
        
        // Advanced UI interactions
        swipe: () => this.handleSwipe(target, value, finalConfig),
        pinch: () => this.handlePinch(target, value, finalConfig),
        zoom: () => this.handleZoom(target, value, finalConfig)
      };

      const handler = actions[action];
      if (!handler) {
        throw new ValidationError(
          `Unknown action: ${action}. Supported actions: ${Object.keys(actions).join(', ')}`
        );
      }

      const result = await this.executeWithTimeout(handler(), finalConfig.timeout);
      const processingTime = Math.round(performance.now() - startTime);

      const enhancedResult = {
        ...result,
        metadata: {
          action,
          target,
          value,
          processingTime,
          manipulationId,
          timestamp: new Date().toISOString(),
          viewport: this.getViewportInfo(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          performanceMetrics: this.getPerformanceMetrics()
        }
      };

      this.log(`✅ DOM manipulation completed`, { 
        action, 
        processingTime, 
        success: result.success 
      });
      
      if (finalConfig.enableAnalytics) {
        this.trackInteraction(enhancedResult);
      }

      // Store operation for undo if successful and enabled
      if (result.success && finalConfig.enableUndo && this.isUndoableAction(action)) {
        this.pushToUndoStack({ action, target, value, options, result });
      }

      return enhancedResult;

    } catch (error) {
      const processingTime = Math.round(performance.now() - startTime);
      
      this.log(`❌ DOM manipulation failed`, { 
        action, 
        error: error.message, 
        processingTime 
      });

      return {
        success: false,
        error: error.message,
        errorType: error.name,
        action,
        target,
        processingTime,
        manipulationId,
        timestamp: new Date().toISOString(),
        suggestions: this.generateErrorSuggestions(error, action, target)
      };
    }
  }

  // ===== FORM OPERATIONS =====
  async handleFormFill(selector, formData, config) {
    try {
      const form = await this.findElement(selector, config);
      if (!form) {
        return { success: false, error: `Form not found: ${selector}` };
      }

      const fillResults = [];
      const formElements = form.querySelectorAll('input, select, textarea');
      
      for (const [fieldName, fieldValue] of Object.entries(formData)) {
        const field = form.querySelector(`[name="${fieldName}"], #${fieldName}, [data-field="${fieldName}"]`);
        
        if (!field) {
          fillResults.push({ field: fieldName, success: false, error: 'Field not found' });
          continue;
        }

        try {
          const fillResult = await this.fillFormField(field, fieldValue, config);
          fillResults.push({ field: fieldName, success: fillResult.success, ...fillResult });
        } catch (error) {
          fillResults.push({ field: fieldName, success: false, error: error.message });
        }
      }

      const successCount = fillResults.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        message: `Filled ${successCount}/${fillResults.length} form fields`,
        results: fillResults,
        form: {
          tagName: form.tagName,
          id: form.id,
          action: form.action,
          method: form.method
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fillFormField(field, value, config) {
    const fieldType = field.type?.toLowerCase() || field.tagName.toLowerCase();
    
    switch (fieldType) {
      case 'text':
      case 'email':
      case 'password':
      case 'search':
      case 'url':
      case 'tel':
      case 'textarea':
        return await this.fillTextInput(field, value, config);
        
      case 'select':
      case 'select-one':
      case 'select-multiple':
        return await this.selectOption(field, value, config);
        
      case 'checkbox':
        return await this.toggleCheckbox(field, value, config);
        
      case 'radio':
        return await this.selectRadio(field, value, config);
        
      case 'range':
      case 'number':
        return await this.setNumericInput(field, value, config);
        
      case 'date':
      case 'datetime-local':
      case 'time':
        return await this.setDateTimeInput(field, value, config);
        
      case 'file':
        return await this.handleFileInput(field, value, config);
        
      default:
        field.value = value;
        this.triggerEvent(field, 'input');
        this.triggerEvent(field, 'change');
        return { success: true, message: `Set ${fieldType} field to: ${value}` };
    }
  }

  async fillTextInput(field, value, config) {
    // Clear existing value
    field.value = '';
    field.focus();
    
    if (config.typeSpeed && config.typeSpeed > 0) {
      // Simulate typing
      for (let i = 0; i < value.length; i++) {
        field.value = value.substring(0, i + 1);
        this.triggerEvent(field, 'input');
        await this.sleep(config.typeSpeed);
      }
    } else {
      field.value = value;
      this.triggerEvent(field, 'input');
    }
    
    this.triggerEvent(field, 'change');
    this.triggerEvent(field, 'blur');
    
    return { success: true, message: `Filled text input with: ${value}` };
  }

  // ===== KEYBOARD OPERATIONS =====
  async handleKeyboard(selector, keys, config) {
    try {
      const element = await this.findElement(selector, config);
      if (!element) {
        return { success: false, error: `Element not found: ${selector}` };
      }

      element.focus();
      
      const keySequence = this.parseKeySequence(keys);
      const results = [];
      
      for (const key of keySequence) {
        try {
          const result = await this.simulateKeyPress(element, key, config);
          results.push(result);
          
          if (config.keyDelay) {
            await this.sleep(config.keyDelay);
          }
        } catch (error) {
          results.push({ key, success: false, error: error.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      return {
        success: successCount > 0,
        message: `Executed ${successCount}/${results.length} key events`,
        results: results,
        element: {
          tagName: element.tagName,
          id: element.id
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async simulateKeyPress(element, key, config) {
    const keyInfo = this.parseKeyInfo(key);
    
    // Key down event
    const keyDownEvent = new KeyboardEvent('keydown', {
      key: keyInfo.key,
      code: keyInfo.code,
      keyCode: keyInfo.keyCode,
      which: keyInfo.keyCode,
      ctrlKey: keyInfo.modifiers.includes('ctrl'),
      shiftKey: keyInfo.modifiers.includes('shift'),
      altKey: keyInfo.modifiers.includes('alt'),
      metaKey: keyInfo.modifiers.includes('meta'),
      bubbles: true,
      cancelable: true
    });
    
    // Key press event (for printable characters)
    let keyPressEvent = null;
    if (keyInfo.isPrintable) {
      keyPressEvent = new KeyboardEvent('keypress', {
        key: keyInfo.key,
        code: keyInfo.code,
        keyCode: keyInfo.keyCode,
        which: keyInfo.keyCode,
        ctrlKey: keyInfo.modifiers.includes('ctrl'),
        shiftKey: keyInfo.modifiers.includes('shift'),
        altKey: keyInfo.modifiers.includes('alt'),
        metaKey: keyInfo.modifiers.includes('meta'),
        bubbles: true,
        cancelable: true
      });
    }
    
    // Key up event
    const keyUpEvent = new KeyboardEvent('keyup', {
      key: keyInfo.key,
      code: keyInfo.code,
      keyCode: keyInfo.keyCode,
      which: keyInfo.keyCode,
      ctrlKey: keyInfo.modifiers.includes('ctrl'),
      shiftKey: keyInfo.modifiers.includes('shift'),
      altKey: keyInfo.modifiers.includes('alt'),
      metaKey: keyInfo.modifiers.includes('meta'),
      bubbles: true,
      cancelable: true
    });
    
    // Dispatch events
    element.dispatchEvent(keyDownEvent);
    if (keyPressEvent) {
      element.dispatchEvent(keyPressEvent);
    }
    element.dispatchEvent(keyUpEvent);
    
    // Handle special key behaviors
    await this.handleSpecialKeyBehavior(element, keyInfo, config);
    
    return { 
      key: key, 
      success: true, 
      message: `Simulated key press: ${key}`,
      keyInfo: keyInfo
    };
  }

  // ===== ELEMENT CREATION/MODIFICATION =====
  async handleCreate(elementConfig, parentSelector, config) {
    try {
      const parent = parentSelector ? 
        await this.findElement(parentSelector, config) : 
        document.body;
        
      if (!parent) {
        return { success: false, error: `Parent element not found: ${parentSelector}` };
      }

      const element = this.createElement(elementConfig);
      parent.appendChild(element);
      
      // Optional: Apply additional configurations
      if (elementConfig.events) {
        this.attachEventListeners(element, elementConfig.events);
      }
      
      if (elementConfig.animations) {
        await this.applyAnimations(element, elementConfig.animations);
      }
      
      return {
        success: true,
        message: `Created ${elementConfig.tag || 'element'}`,
        element: {
          tagName: element.tagName,
          id: element.id,
          className: element.className,
          selector: this.generateSelector(element)
        },
        parent: {
          tagName: parent.tagName,
          id: parent.id
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  createElement(config) {
    const element = document.createElement(config.tag || 'div');
    
    // Set attributes
    if (config.attributes) {
      Object.entries(config.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
      
      // Set styles
      if (config.styles) {
        Object.entries(config.styles).forEach(([property, value]) => {
          element.style[property] = value;
        });
      }
      
      // Set text content
      if (config.textContent) {
        element.textContent = config.textContent;
      }
      
      // Set innerHTML (with security check)
      if (config.innerHTML && this.config.enableSafeMode) {
        const sanitizedHTML = this.sanitizeHTML(config.innerHTML);
        element.innerHTML = sanitizedHTML;
      } else if (config.innerHTML) {
        element.innerHTML = config.innerHTML;
      }
      
      return element;
    }

    attachEventListeners(element, events) {
      Object.entries(events).forEach(([eventType, handler]) => {
        const eventId = `${element.id || 'element'}_${eventType}_${Date.now()}`;
        
        if (typeof handler === 'function') {
          element.addEventListener(eventType, handler);
          this.eventListeners.set(eventId, { element, eventType, handler });
        }
      });
    }

    async handleModify(selector, modifications, config) {
      try {
        const element = await this.findElement(selector, config);
        if (!element) {
          return { success: false, error: `Element not found: ${selector}` };
        }

        const originalState = this.captureElementState(element);
        const modificationResults = [];

        // Process each modification
        for (const [property, value] of Object.entries(modifications)) {
          try {
            const result = await this.applyModification(element, property, value, config);
            modificationResults.push({ property, success: result.success, ...result });
          } catch (error) {
            modificationResults.push({ 
              property, 
              success: false, 
              error: error.message 
            });
          }
        }

        const successCount = modificationResults.filter(r => r.success).length;
        
        // Store for undo if successful
        if (successCount > 0 && config.enableUndo) {
          this.storeUndoState(selector, originalState, modifications);
        }

        return {
          success: successCount > 0,
          message: `Modified ${successCount}/${modificationResults.length} properties`,
          modifications: modificationResults,
          element: {
            tagName: element.tagName,
            id: element.id,
            className: element.className
          },
          undoId: config.enableUndo ? this.generateUndoId() : null
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async applyModification(element, property, value, config) {
      switch (property) {
        case 'textContent':
          element.textContent = value;
          return { success: true, message: `Text content updated` };
          
        case 'innerHTML':
          if (config.enableSafeMode) {
            const sanitized = this.sanitizeHTML(value);
            element.innerHTML = sanitized;
          } else {
            element.innerHTML = value;
          }
          return { success: true, message: `HTML content updated` };
          
        case 'style':
          Object.entries(value).forEach(([styleProp, styleValue]) => {
            element.style[styleProp] = styleValue;
          });
          return { success: true, message: `Styles updated` };
          
        case 'attributes':
          Object.entries(value).forEach(([attr, attrValue]) => {
            element.setAttribute(attr, attrValue);
          });
          return { success: true, message: `Attributes updated` };
          
        case 'classList':
          if (value.add) {
            value.add.forEach(cls => element.classList.add(cls));
          }
          if (value.remove) {
            value.remove.forEach(cls => element.classList.remove(cls));
          }
          if (value.toggle) {
            value.toggle.forEach(cls => element.classList.toggle(cls));
          }
          return { success: true, message: `Classes updated` };
          
        default:
          // Direct property assignment
          if (property in element) {
            element[property] = value;
            return { success: true, message: `Property ${property} updated` };
          } else {
            return { success: false, error: `Unknown property: ${property}` };
          }
      }
    }

    async handleRemove(selector, config) {
      try {
        const element = await this.findElement(selector, config);
        if (!element) {
          return { success: false, error: `Element not found: ${selector}` };
        }

        // Store element state for potential restoration
        const elementState = this.captureFullElementState(element);
        
        // Optional fade-out animation
        if (config.useAnimation) {
          await this.animateRemoval(element, config);
        }

        // Remove element
        const parent = element.parentNode;
        parent.removeChild(element);

        // Store for undo
        if (config.enableUndo) {
          this.storeRemovedElement(elementState, parent);
        }

        return {
          success: true,
          message: `Removed element: ${selector}`,
          element: {
            tagName: element.tagName,
            id: element.id,
            className: element.className
          },
          undoId: config.enableUndo ? this.generateUndoId() : null
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async handleClone(selector, targetSelector, config) {
      try {
        const sourceElement = await this.findElement(selector, config);
        if (!sourceElement) {
          return { success: false, error: `Source element not found: ${selector}` };
        }

        const targetParent = targetSelector ? 
          await this.findElement(targetSelector, config) : 
          sourceElement.parentNode;
        
        if (!targetParent) {
          return { success: false, error: `Target parent not found: ${targetSelector}` };
        }

        // Clone element
        const clonedElement = sourceElement.cloneNode(config.deep !== false);
        
        // Update IDs to prevent duplicates
        if (clonedElement.id) {
          clonedElement.id = `${clonedElement.id}_clone_${Date.now()}`;
        }

        // Update IDs of nested elements
        const nestedElementsWithIds = clonedElement.querySelectorAll('[id]');
        nestedElementsWithIds.forEach(el => {
          el.id = `${el.id}_clone_${Date.now()}`;
        });

        // Insert cloned element
        const insertPosition = config.position || 'append';
        switch (insertPosition) {
          case 'prepend':
            targetParent.insertBefore(clonedElement, targetParent.firstChild);
            break;
          case 'before':
            targetParent.parentNode.insertBefore(clonedElement, targetParent);
            break;
          case 'after':
            targetParent.parentNode.insertBefore(clonedElement, targetParent.nextSibling);
            break;
          default:
            targetParent.appendChild(clonedElement);
        }

        return {
          success: true,
          message: `Cloned element: ${selector}`,
          sourceElement: {
            tagName: sourceElement.tagName,
            id: sourceElement.id
          },
          clonedElement: {
            tagName: clonedElement.tagName,
            id: clonedElement.id,
            selector: this.generateSelector(clonedElement)
          }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // ===== ADVANCED WAITING MECHANISMS =====
    async waitForElement(selector, config) {
      const startTime = Date.now();
      const timeout = config.waitTimeout || this.config.waitTimeout;
      
      return new Promise((resolve) => {
        const checkElement = () => {
          const element = document.querySelector(selector);
          
          if (element) {
            // Additional condition checks
            if (config.condition && !this.checkElementCondition(element, config.condition)) {
              return false;
            }
            
            resolve({
              success: true,
              message: `Element found: ${selector}`,
              element: {
                tagName: element.tagName,
                id: element.id,
                className: element.className
              },
              waitTime: Date.now() - startTime
            });
            return true;
          }
          
          return false;
        };

        // Initial check
        if (checkElement()) return;

        // Set up mutation observer
        const observer = new MutationObserver(() => {
          if (checkElement()) {
            observer.disconnect();
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: config.watchAttributes || false
        });

        // Timeout fallback
        setTimeout(() => {
          observer.disconnect();
          resolve({
            success: false,
            error: `Element not found within timeout: ${selector}`,
            timeout: timeout,
            waitTime: Date.now() - startTime
          });
        }, timeout);
      });
    }

    async waitForCondition(conditionFunction, testValue, config) {
      const startTime = Date.now();
      const timeout = config.waitTimeout || this.config.waitTimeout;
      const checkInterval = config.checkInterval || 100;
      
      return new Promise((resolve) => {
        const checkCondition = () => {
          try {
            let result;
            
            if (typeof conditionFunction === 'string') {
              // Handle string-based conditions
              result = this.evaluateStringCondition(conditionFunction, testValue);
            } else if (typeof conditionFunction === 'function') {
              // Handle function-based conditions
              result = conditionFunction(testValue);
            } else {
              throw new Error('Invalid condition type');
            }
            
            if (result) {
              resolve({
                success: true,
                message: 'Condition met',
                waitTime: Date.now() - startTime,
                result: result
              });
              return true;
            }
          } catch (error) {
            resolve({
              success: false,
              error: `Condition evaluation error: ${error.message}`,
              waitTime: Date.now() - startTime
            });
            return true;
          }
          
          return false;
        };

        // Initial check
        if (checkCondition()) return;

        // Periodic checks
        const intervalId = setInterval(() => {
          if (checkCondition()) {
            clearInterval(intervalId);
          }
        }, checkInterval);

        // Timeout
        setTimeout(() => {
          clearInterval(intervalId);
          resolve({
            success: false,
            error: 'Condition timeout',
            timeout: timeout,
            waitTime: Date.now() - startTime
          });
        }, timeout);
      });
    }

    async waitForNavigation(config) {
      const currentUrl = window.location.href;
      
      return new Promise((resolve) => {
        const checkNavigation = () => {
          if (window.location.href !== currentUrl) {
            resolve({
              success: true,
              message: 'Navigation completed',
              from: currentUrl,
              to: window.location.href
            });
          }
        };

        // Listen for navigation events
        window.addEventListener('popstate', checkNavigation);
        window.addEventListener('pushstate', checkNavigation);
        window.addEventListener('replacestate', checkNavigation);
        
        // Also check for URL changes periodically
        const checkInterval = setInterval(checkNavigation, 100);

        // Timeout
        setTimeout(() => {
          clearInterval(checkInterval);
          window.removeEventListener('popstate', checkNavigation);
          window.removeEventListener('pushstate', checkNavigation);
          window.removeEventListener('replacestate', checkNavigation);
          
          resolve({
            success: false,
            error: 'Navigation timeout',
            currentUrl: window.location.href
          });
        }, config.waitTimeout || this.config.waitTimeout);
      });
    }

    async waitForPageLoad(config) {
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve({
            success: true,
            message: 'Page already loaded',
            readyState: document.readyState
          });
          return;
        }

        const handleLoad = () => {
          resolve({
            success: true,
            message: 'Page load completed',
            readyState: document.readyState,
            loadTime: performance.now()
          });
        };

        window.addEventListener('load', handleLoad, { once: true });

        // Also listen for document ready state changes
        const checkReady = () => {
          if (document.readyState === 'complete') {
            window.removeEventListener('load', handleLoad);
            handleLoad();
          }
        };

        document.addEventListener('readystatechange', checkReady);

        // Timeout
        setTimeout(() => {
          window.removeEventListener('load', handleLoad);
          document.removeEventListener('readystatechange', checkReady);
          
          resolve({
            success: false,
            error: 'Page load timeout',
            readyState: document.readyState
          });
        }, config.waitTimeout || this.config.waitTimeout);
      });
    }

    // ===== DRAG AND DROP OPERATIONS =====
    async handleDrag(sourceSelector, targetSelector, config) {
      try {
        const sourceElement = await this.findElement(sourceSelector, config);
        const targetElement = await this.findElement(targetSelector, config);
        
        if (!sourceElement) {
          return { success: false, error: `Source element not found: ${sourceSelector}` };
        }
        
        if (!targetElement) {
          return { success: false, error: `Target element not found: ${targetSelector}` };
        }

        // Make element draggable if not already
        sourceElement.draggable = true;

        // Simulate drag events
        const dragStartEvent = new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer()
        });
        
        const dragEvent = new DragEvent('drag', {
          bubbles: true,
          cancelable: true
        });
        
        const dragEndEvent = new DragEvent('dragend', {
          bubbles: true,
          cancelable: true
        });

        // Dispatch drag events
        sourceElement.dispatchEvent(dragStartEvent);
        
        // Optional: Visual feedback during drag
        if (config.showDragFeedback) {
          await this.showDragFeedback(sourceElement, targetElement);
        }
        
        sourceElement.dispatchEvent(dragEvent);
        sourceElement.dispatchEvent(dragEndEvent);

        return {
          success: true,
          message: `Drag operation initiated from ${sourceSelector} to ${targetSelector}`,
          source: {
            tagName: sourceElement.tagName,
            id: sourceElement.id
          },
          target: {
            tagName: targetElement.tagName,
            id: targetElement.id
          }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async handleDrop(targetSelector, dragData, config) {
      try {
        const targetElement = await this.findElement(targetSelector, config);
        
        if (!targetElement) {
          return { success: false, error: `Target element not found: ${targetSelector}` };
        }

        // Create drop events
        const dragEnterEvent = new DragEvent('dragenter', {
          bubbles: true,
          cancelable: true,
          dataTransfer: this.createDataTransfer(dragData)
        });
        
        const dragOverEvent = new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          dataTransfer: this.createDataTransfer(dragData)
        });
        
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: this.createDataTransfer(dragData)
        });

        // Dispatch drop events
        targetElement.dispatchEvent(dragEnterEvent);
        targetElement.dispatchEvent(dragOverEvent);
        targetElement.dispatchEvent(dropEvent);

        // Handle actual drop logic if specified
        if (config.handleDrop) {
          await this.processDrop(targetElement, dragData, config);
        }

        return {
          success: true,
          message: `Drop operation completed on ${targetSelector}`,
          target: {
            tagName: targetElement.tagName,
            id: targetElement.id
          },
          droppedData: dragData
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // ===== CLIPBOARD OPERATIONS =====
    async handleCopy(selector, config) {
      try {
        const element = await this.findElement(selector, config);
        
        if (!element) {
          return { success: false, error: `Element not found: ${selector}` };
        }

        let textToCopy = '';
        
        if (config.copyType === 'innerHTML') {
          textToCopy = element.innerHTML;
        } else if (config.copyType === 'outerHTML') {
          textToCopy = element.outerHTML;
        } else if (config.copyType === 'value' && element.value !== undefined) {
          textToCopy = element.value;
        } else {
          textToCopy = element.textContent || element.innerText;
        }

        // Use modern clipboard API if available
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          // Fallback to legacy method
          await this.legacyCopyToClipboard(textToCopy);
        }

        return {
          success: true,
          message: `Copied content from ${selector}`,
          copiedText: textToCopy.substring(0, 100) + (textToCopy.length > 100 ? '...' : ''),
          textLength: textToCopy.length,
          copyType: config.copyType || 'textContent'
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async handlePaste(selector, text, config) {
      try {
        const element = await this.findElement(selector, config);
        
        if (!element) {
          return { success: false, error: `Element not found: ${selector}` };
        }

        // Get text to paste
        let textToPaste = text;
        
        if (!textToPaste && navigator.clipboard) {
          try {
            textToPaste = await navigator.clipboard.readText();
          } catch (clipboardError) {
            return { 
              success: false, 
              error: 'Unable to read from clipboard. Text parameter required.' 
            };
          }
        }

        if (!textToPaste) {
          return { success: false, error: 'No text to paste' };
        }

        // Paste based on element type
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.focus();
          element.value = textToPaste;
          this.triggerEvent(element, 'input');
          this.triggerEvent(element, 'change');
        } else {
          if (config.pasteAs === 'innerHTML') {
            element.innerHTML = textToPaste;
          } else {
            element.textContent = textToPaste;
          }
        }

        return {
          success: true,
          message: `Pasted content to ${selector}`,
          pastedText: textToPaste.substring(0, 100) + (textToPaste.length > 100 ? '...' : ''),
                    textLength: textToPaste.length,
          pasteMethod: config.pasteAs || 'textContent'
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // ===== ADVANCED GESTURE SUPPORT =====
    async handleSwipe(selector, direction, config) {
      try {
        const element = await this.findElement(selector, config);
        
        if (!element) {
          return { success: false, error: `Element not found: ${selector}` };
        }

        const swipeDistance = config.distance || 100;
        const swipeDuration = config.duration || 300;
        
        // Calculate swipe coordinates
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let startX = centerX, startY = centerY;
        let endX = centerX, endY = centerY;
        
        switch (direction.toLowerCase()) {
          case 'left':
            startX = centerX + swipeDistance / 2;
            endX = centerX - swipeDistance / 2;
            break;
          case 'right':
            startX = centerX - swipeDistance / 2;
            endX = centerX + swipeDistance / 2;
            break;
          case 'up':
            startY = centerY + swipeDistance / 2;
            endY = centerY - swipeDistance / 2;
            break;
          case 'down':
            startY = centerY - swipeDistance / 2;
            endY = centerY + swipeDistance / 2;
            break;
          default:
            return { success: false, error: `Invalid swipe direction: ${direction}` };
        }

        // Simulate touch events for swipe
        await this.simulateSwipeGesture(element, startX, startY, endX, endY, swipeDuration);

        return {
          success: true,
          message: `Swipe ${direction} performed on ${selector}`,
          gesture: {
            direction: direction,
            distance: swipeDistance,
            duration: swipeDuration,
            coordinates: { startX, startY, endX, endY }
          }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async handlePinch(selector, scale, config) {
      try {
        const element = await this.findElement(selector, config);
        
        if (!element) {
          return { success: false, error: `Element not found: ${selector}` };
        }

        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Simulate pinch gesture
        await this.simulatePinchGesture(element, centerX, centerY, scale, config);

        return {
          success: true,
          message: `Pinch gesture performed on ${selector}`,
          gesture: {
            type: 'pinch',
            scale: scale,
            center: { x: centerX, y: centerY }
          }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async handleZoom(selector, zoomLevel, config) {
      try {
        const element = await this.findElement(selector, config);
        
        if (!element) {
          return { success: false, error: `Element not found: ${selector}` };
        }

        // Apply zoom transformation
        const currentTransform = element.style.transform || '';
        const newTransform = `${currentTransform} scale(${zoomLevel})`.trim();
        
        element.style.transform = newTransform;
        element.style.transformOrigin = config.origin || 'center';

        // Optional smooth transition
        if (config.animate) {
          element.style.transition = `transform ${config.duration || 300}ms ease-in-out`;
        }

        return {
          success: true,
          message: `Zoom applied to ${selector}`,
          zoom: {
            level: zoomLevel,
            origin: config.origin || 'center',
            animated: !!config.animate
          }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // ===== UNDO/REDO SYSTEM =====
    async handleUndo(config) {
      try {
        if (this.undoStack.length === 0) {
          return {
            success: false,
            error: 'No actions to undo',
            undoStackSize: 0
          };
        }

        const lastAction = this.undoStack.pop();
        
        // Perform undo operation
        const undoResult = await this.performUndo(lastAction);
        
        if (undoResult.success) {
          // Move to redo stack
          this.redoStack.push(lastAction);
          
          // Limit redo stack size
          if (this.redoStack.length > this.config.maxHistorySize) {
            this.redoStack.shift();
          }
        }

        return {
          success: undoResult.success,
          message: undoResult.success ? 
            `Undid action: ${lastAction.action}` : 
            `Undo failed: ${undoResult.error}`,
          undoAction: lastAction.action,
          undoStackSize: this.undoStack.length,
          redoStackSize: this.redoStack.length
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    async handleRedo(config) {
      try {
        if (this.redoStack.length === 0) {
          return {
            success: false,
            error: 'No actions to redo',
            redoStackSize: 0
          };
        }

        const redoAction = this.redoStack.pop();
        
        // Perform redo operation
        const redoResult = await this.performRedo(redoAction);
        
        if (redoResult.success) {
          // Move back to undo stack
          this.undoStack.push(redoAction);
        }

        return {
          success: redoResult.success,
          message: redoResult.success ? 
            `Redid action: ${redoAction.action}` : 
            `Redo failed: ${redoResult.error}`,
          redoAction: redoAction.action,
          undoStackSize: this.undoStack.length,
          redoStackSize: this.redoStack.length
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // ===== ACCESSIBILITY FEATURES =====
    announceToScreenReader(message) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';
      
      document.body.appendChild(announcement);
      announcement.textContent = message;
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }

    getElementDescription(element) {
      const descriptions = [];
      
      if (element.tagName) {
        descriptions.push(element.tagName.toLowerCase());
      }
      
      if (element.id) {
        descriptions.push(`with ID ${element.id}`);
      }
      
      if (element.textContent && element.textContent.trim()) {
        descriptions.push(`containing "${element.textContent.trim().substring(0, 50)}"`);
      }
      
      return descriptions.join(' ');
    }

    // ===== UTILITY AND HELPER METHODS =====
    async findElement(selector, config, retryCount = 0) {
      if (!selector) return null;
      
      // Check cache first
      const cacheKey = `${selector}_${JSON.stringify(config)}`;
      if (this.elementCache.has(cacheKey)) {
        const cached = this.elementCache.get(cacheKey);
        if (document.contains(cached.element)) {
          return cached.element;
        } else {
          this.elementCache.delete(cacheKey);
        }
      }
      
      let element = null;
      
      try {
        // Try different selector strategies
        element = document.querySelector(selector) ||
                 document.getElementById(selector) ||
                 document.getElementsByName(selector)[0] ||
                 document.getElementsByClassName(selector)[0];
        
        // XPath support
        if (!element && selector.startsWith('//')) {
          const result = document.evaluate(
            selector,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          element = result.singleNodeValue;
        }
        
        // Text content search
        if (!element && config.searchByText) {
          element = this.findElementByText(selector, config);
        }
        
        // Fuzzy matching
        if (!element && config.fuzzyMatch) {
          element = this.fuzzyFindElement(selector, config);
        }
        
      } catch (error) {
        this.log(`Element selection error: ${error.message}`);
      }
      
      // Retry logic
      if (!element && retryCount < this.config.maxRetries) {
        await this.sleep(config.retryDelay || 500);
        return await this.findElement(selector, config, retryCount + 1);
      }
      
      // Cache successful finds
      if (element) {
        this.elementCache.set(cacheKey, { 
          element, 
          timestamp: Date.now(),
          selector 
        });
      }
      
      return element;
    }

    findElementByText(text, config) {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.trim().includes(text)) {
          return node.parentElement;
        }
      }
      
      return null;
    }

    fuzzyFindElement(selector, config) {
      const allElements = document.querySelectorAll('*');
      const threshold = config.fuzzyThreshold || 0.7;
      
      for (const element of allElements) {
        const similarity = this.calculateSimilarity(
          selector.toLowerCase(),
          (element.id + ' ' + element.className + ' ' + element.tagName).toLowerCase()
        );
        
        if (similarity >= threshold) {
          return element;
        }
      }
      
      return null;
    }

    calculateSimilarity(str1, str2) {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      
      if (longer.length === 0) return 1.0;
      
      return (longer.length - this.editDistance(longer, shorter)) / longer.length;
    }

    editDistance(str1, str2) {
      const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
      
      for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
      
      for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
          if (str1[i - 1] === str2[j - 1]) {
            matrix[j][i] = matrix[j - 1][i - 1];
          } else {
            matrix[j][i] = Math.min(
              matrix[j - 1][i - 1] + 1,
              matrix[j][i - 1] + 1,
              matrix[j - 1][i] + 1
            );
          }
        }
      }
      
      return matrix[str2.length][str1.length];
    }

    isElementClickable(element) {
      const computedStyle = window.getComputedStyle(element);
      
      return (
        computedStyle.pointerEvents !== 'none' &&
        computedStyle.visibility !== 'hidden' &&
        computedStyle.display !== 'none' &&
        element.offsetParent !== null &&
        !element.disabled
      );
    }

    isElementFocusable(element) {
      const focusableElements = [
        'input', 'textarea', 'select', 'button', 'a'
      ];
      
      const tagName = element.tagName.toLowerCase();
      
      return (
        focusableElements.includes(tagName) ||
        element.tabIndex >= 0 ||
        element.contentEditable === 'true'
      ) && !element.disabled;
    }

    generateSelector(element) {
      const selectors = [];
      
      if (element.id) {
        selectors.push(`#${element.id}`);
      }
      
      if (element.className) {
        const classes = element.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          selectors.push(`.${classes.join('.')}`);
        }
      }
      
      // Generate hierarchical selector
      const path = [];
      let current = element;
      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        
        if (current.id) {
          selector += `#${current.id}`;
          path.unshift(selector);
          break;
        }
        
        if (current.className) {
          const classes = current.className.split(' ').filter(c => c.trim());
          if (classes.length > 0) {
            selector += `.${classes[0]}`;
          }
        }
        
        path.unshift(selector);
        current = current.parentElement;
      }
      
      selectors.push(path.join(' > '));
      
      return selectors[0] || 'unknown';
    }

    sanitizeHTML(html) {
      const div = document.createElement('div');
      div.innerHTML = html;
      
      // Remove script tags and event handlers
      const scripts = div.querySelectorAll('script');
      scripts.forEach(script => script.remove());
      
      const allElements = div.querySelectorAll('*');
      allElements.forEach(element => {
        // Remove event handler attributes
        const attributes = [...element.attributes];
        attributes.forEach(attr => {
          if (attr.name.startsWith('on')) {
            element.removeAttribute(attr.name);
          }
        });
      });
      
      return div.innerHTML;
    }

    async executeWithTimeout(promise, timeout) {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), timeout)
        )
      ]);
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message, data = {}) {
      if (this.config.debugMode) {
        console.log(`[DOMManipulator] ${message}`, data);
      }
    }

    // ===== INITIALIZATION METHODS =====
    initializeObservers() {
      // Intersection Observer for visibility tracking
      if (this.config.enableProgressTracking) {
        this.intersectionObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            this.handleVisibilityChange(entry);
          });
        });
      }

      // Mutation Observer for DOM changes
      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          this.handleDOMChange(mutation);
        });
      });

      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true
      });
    }

    injectStyles() {
      if (document.querySelector('#dom-manipulator-styles')) return;

      const style = document.createElement('style');
      style.id = 'dom-manipulator-styles';
      style.textContent = `
        .dom-manipulator-highlight {
          position: relative;
          z-index: 10000;
        }
        
        @keyframes dom-manipulator-pulse {
          0%, 100% { 
            box-shadow: 0 0 10px ${this.config.highlightColor}; 
            outline: 2px solid ${this.config.highlightColor};
          }
          50% { 
            box-shadow: 0 0 30px ${this.config.highlightColor}, 0 0 60px ${this.config.highlightColor}40; 
            outline: 3px solid ${this.config.highlightColor};
          }
        }
        
        .dom-manipulator-drag-feedback {
          opacity: 0.7;
          transform: scale(1.05);
          transition: all 0.2s ease;
        }
        
        .dom-manipulator-focus-indicator {
          outline: 3px solid #4A90E2;
          outline-offset: 2px;
        }
      `;
      
      document.head.appendChild(style);
    }

    setupGlobalEventHandlers() {
      // Handle page unload
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });

      // Handle errors
      window.addEventListener('error', (event) => {
        this.log('Global error caught:', event.error);
      });
    }

    cleanup() {
      // Clear intervals and observers
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
      }
      
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
      }
      
      // Clear caches
      this.elementCache.clear();
      this.preloadCache.clear();
      
      // Remove event listeners
      this.eventListeners.forEach(({ element, eventType, handler }) => {
        element.removeEventListener(eventType, handler);
      });
      this.eventListeners.clear();
      
      this.log('DOM Manipulator cleaned up');
    }
  }

  // ===== GLOBAL DOM MANIPULATION FUNCTIONS =====

  // Enhanced global manipulation function
  async function manipulatePage(params = {}) {
    try {
      // Initialize global manipulator if not exists
      if (!window.__advancedDOMManipulator) {
        window.__advancedDOMManipulator = new AdvancedDOMManipulator({
          debugMode: true,
          enableSecurityChecks: true,
          enableAnalytics: true,
          enableUndo: true
        });
      }

      return await window.__advancedDOMManipulator.manipulatePage(params);
      
    } catch (error) {
      console.error('❌ DOM manipulation system error:', error);
      
      // Fallback to basic manipulation
      return {
        success: false,
                error: error.message,
        fallback: true,
        basicResult: performBasicManipulation(params)
      };
    }
  }

  // Fallback basic manipulation
  function performBasicManipulation(params) {
    try {
      const { action, target, value } = params;
      
      switch (action) {
        case 'scroll':
          if (target === 'top') {
            window.scrollTo(0, 0);
            return { success: true, message: 'Scrolled to top' };
          } else if (target === 'bottom') {
            window.scrollTo(0, document.body.scrollHeight);
            return { success: true, message: 'Scrolled to bottom' };
          }
          break;
          
        case 'click':
          const element = document.querySelector(target);
          if (element) {
            element.click();
            return { success: true, message: `Clicked ${target}` };
          }
          break;
          
        case 'focus':
          const focusElement = document.querySelector(target);
          if (focusElement) {
            focusElement.focus();
            return { success: true, message: `Focused ${target}` };
          }
          break;
      }
      
      return { success: false, error: 'Basic manipulation failed' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Batch manipulation function
  async function manipulateBatch(operations, options = {}) {
    if (!window.__advancedDOMManipulator) {
      window.__advancedDOMManipulator = new AdvancedDOMManipulator();
    }
    
    const batchId = `batch_${Date.now()}`;
    const results = [];
    
    try {
      const batchOptions = {
        sequential: options.sequential !== false, // Default to sequential
        stopOnError: options.stopOnError || false,
        delay: options.delay || 0,
        ...options
      };
      
      if (batchOptions.sequential) {
        // Execute operations sequentially
        for (let i = 0; i < operations.length; i++) {
          const operation = operations[i];
          
          try {
            const result = await window.__advancedDOMManipulator.manipulatePage(operation);
            results.push({ index: i, operation, result });
            
            if (!result.success && batchOptions.stopOnError) {
              break;
            }
            
            if (batchOptions.delay > 0 && i < operations.length - 1) {
              await new Promise(resolve => setTimeout(resolve, batchOptions.delay));
            }
            
          } catch (error) {
            results.push({ 
              index: i, 
              operation, 
              result: { success: false, error: error.message } 
            });
            
            if (batchOptions.stopOnError) {
              break;
            }
          }
        }
      } else {
        // Execute operations in parallel
        const promises = operations.map((operation, index) => 
          window.__advancedDOMManipulator.manipulatePage(operation)
            .then(result => ({ index, operation, result }))
            .catch(error => ({ 
              index, 
              operation, 
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
        totalOperations: operations.length,
        successfulOperations: successCount,
        failedOperations: results.length - successCount,
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

  // Element waiting functions
  async function waitForElement(selector, options = {}) {
    if (!window.__advancedDOMManipulator) {
      window.__advancedDOMManipulator = new AdvancedDOMManipulator();
    }
    
    return await window.__advancedDOMManipulator.waitForElement(selector, options);
  }

  async function waitForCondition(condition, testValue, options = {}) {
    if (!window.__advancedDOMManipulator) {
      window.__advancedDOMManipulator = new AdvancedDOMManipulator();
    }
    
    return await window.__advancedDOMManipulator.waitForCondition(condition, testValue, options);
  }

  // Form manipulation functions
  async function fillForm(formSelector, formData, options = {}) {
    if (!window.__advancedDOMManipulator) {
      window.__advancedDOMManipulator = new AdvancedDOMManipulator();
    }
    
    return await window.__advancedDOMManipulator.handleFormFill(formSelector, formData, options);
  }

  // Element creation functions
  async function createElement(elementConfig, parentSelector, options = {}) {
    if (!window.__advancedDOMManipulator) {
      window.__advancedDOMManipulator = new AdvancedDOMManipulator();
    }
    
    return await window.__advancedDOMManipulator.handleCreate(elementConfig, parentSelector, options);
  }

  // Undo/Redo functions
  async function undoLastAction(options = {}) {
    if (!window.__advancedDOMManipulator) {
      return { success: false, error: 'DOM manipulator not initialized' };
    }
    
    return await window.__advancedDOMManipulator.handleUndo(options);
  }

  async function redoLastAction(options = {}) {
    if (!window.__advancedDOMManipulator) {
      return { success: false, error: 'DOM manipulator not initialized' };
    }
    
    return await window.__advancedDOMManipulator.handleRedo(options);
  }

  // Analytics and monitoring functions
  function getDOMMetrics() {
    if (!window.__advancedDOMManipulator) {
      return { success: false, error: 'DOM manipulator not initialized' };
    }
    
    return {
      success: true,
      metrics: {
        undoStackSize: window.__advancedDOMManipulator.undoStack.length,
        redoStackSize: window.__advancedDOMManipulator.redoStack.length,
        cachedElements: window.__advancedDOMManipulator.elementCache.size,
        activeListeners: window.__advancedDOMManipulator.eventListeners.size,
        activeHighlights: window.__advancedDOMManipulator.activeHighlights.size
      }
    };
  }

  // Accessibility functions
  function announceToScreenReader(message) {
    if (!window.__advancedDOMManipulator) {
      window.__advancedDOMManipulator = new AdvancedDOMManipulator();
    }
    
    window.__advancedDOMManipulator.announceToScreenReader(message);
    
    return {
      success: true,
      message: `Screen reader announcement: ${message}`
    };
  }

  // Export all functions for global use
  if (typeof window !== 'undefined') {
    window.__domManipulator = {
      // Core manipulation
      manipulatePage,
      manipulateBatch,
      
      // Element operations
      waitForElement,
      waitForCondition,
      createElement,
      fillForm,
      
      // History management
      undoLastAction,
      redoLastAction,
      
      // Utility functions
      getDOMMetrics,
      announceToScreenReader,
      
      // Advanced features
      dragAndDrop: async (sourceSelector, targetSelector, options = {}) => {
        if (!window.__advancedDOMManipulator) {
          window.__advancedDOMManipulator = new AdvancedDOMManipulator();
        }
        
        const dragResult = await window.__advancedDOMManipulator.handleDrag(sourceSelector, targetSelector, options);
        if (dragResult.success && options.completeDrop) {
          return await window.__advancedDOMManipulator.handleDrop(targetSelector, options.dragData || {}, options);
        }
        return dragResult;
      },
      
      swipeGesture: async (selector, direction, options = {}) => {
        if (!window.__advancedDOMManipulator) {
          window.__advancedDOMManipulator = new AdvancedDOMManipulator();
        }
        
        return await window.__advancedDOMManipulator.handleSwipe(selector, direction, options);
      },
      
      copyToClipboard: async (selector, options = {}) => {
        if (!window.__advancedDOMManipulator) {
          window.__advancedDOMManipulator = new AdvancedDOMManipulator();
        }
        
        return await window.__advancedDOMManipulator.handleCopy(selector, options);
      },
      
      pasteFromClipboard: async (selector, text, options = {}) => {
        if (!window.__advancedDOMManipulator) {
          window.__advancedDOMManipulator = new AdvancedDOMManipulator();
        }
        
        return await window.__advancedDOMManipulator.handlePaste(selector, text, options);
      },
      
      measureElement: async (selector, options = {}) => {
        if (!window.__advancedDOMManipulator) {
          window.__advancedDOMManipulator = new AdvancedDOMManipulator();
        }
        
        return await window.__advancedDOMManipulator.handleMeasure(selector, options);
      }
    };
    
    // Auto-initialize on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!window.__advancedDOMManipulator) {
          window.__advancedDOMManipulator = new AdvancedDOMManipulator({
            debugMode: false,
            enableSecurityChecks: true,
            enableAnalytics: true
          });
        }
      });
    } else if (!window.__advancedDOMManipulator) {
      window.__advancedDOMManipulator = new AdvancedDOMManipulator({
        debugMode: false,
        enableSecurityChecks: true,
        enableAnalytics: true
      });
    }
  }

