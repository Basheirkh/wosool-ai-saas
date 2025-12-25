/**
 * Intent Analyzer Tool
 * Analyzes user behavior and predicts shopping intent
 */
/* OLD start
const intentTracker = {
  sessionStart: Date.now(),
  events: [],
  scrollEvents: 0,
  clickEvents: 0,
  timeOnPage: 0,
  lastActivity: Date.now()
};

document.addEventListener('scroll', () => {
  intentTracker.scrollEvents++;
  intentTracker.lastActivity = Date.now();
}, { passive: true });

document.addEventListener('click', () => {
  intentTracker.clickEvents++;
  intentTracker.lastActivity = Date.now();
}, { passive: true });

function analyzeUserIntent() {
  console.log('🎯 Intent Analyzer: Analyzing user intent...');
  
  try {
    intentTracker.timeOnPage = (Date.now() - intentTracker.sessionStart) / 1000;
    
    const intent = {
      primaryIntent: determinePrimaryIntent(),
      confidence: calculateConfidence(),
      engagement: calculateEngagement(),
      behavior: {
        scrollEvents: intentTracker.scrollEvents,
        clickEvents: intentTracker.clickEvents,
        timeOnPage: Math.round(intentTracker.timeOnPage),
        lastActivitySeconds: Math.round((Date.now() - intentTracker.lastActivity) / 1000)
      },
      pageContext: {
        pageType: detectPageType(),
        productsViewed: countVisibleProducts(),
        categoriesExplored: countVisitedCategories()
      },
      recommendations: generateRecommendations()
    };
    
    console.log('✅ Intent analyzed:', intent);
    return {
      success: true,
      intent: intent
    };
  } catch (error) {
    console.error('❌ Intent analysis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function determinePrimaryIntent() {
  const timeOnPage = intentTracker.timeOnPage;
  const scrollEvents = intentTracker.scrollEvents;
  const clickEvents = intentTracker.clickEvents;
  
  if (clickEvents > 5 && scrollEvents > 10) {
    return 'shopping';
  }
  
  if (timeOnPage < 30 && scrollEvents < 5) {
    return 'browsing';
  }
  
  if (clickEvents > 2 && scrollEvents > 5 && timeOnPage > 30) {
    return 'comparison';
  }
  
  if (clickEvents < 2 && scrollEvents < 5) {
    return 'information_seeking';
  }
  
  return 'browsing';
}

function calculateConfidence() {
  const timeOnPage = intentTracker.timeOnPage;
  const clickEvents = intentTracker.clickEvents;
  const scrollEvents = intentTracker.scrollEvents;
  
  let confidence = 0.5;
  
  if (timeOnPage > 60) confidence += 0.2;
  if (clickEvents > 5) confidence += 0.15;
  if (scrollEvents > 10) confidence += 0.15;
  
  return Math.min(confidence, 1.0);
}

function calculateEngagement() {
  const timeOnPage = intentTracker.timeOnPage;
  const clickEvents = intentTracker.clickEvents;
  const scrollEvents = intentTracker.scrollEvents;
  
  const engagementScore = (clickEvents * 0.3) + (scrollEvents * 0.2) + (timeOnPage / 10 * 0.5);
  
  if (engagementScore > 15) return 'high';
  if (engagementScore > 7) return 'medium';
  return 'low';
}

function detectPageType() {
  const pathname = window.location.pathname.toLowerCase();
  
  if (pathname.includes('/product/')) return 'product';
  if (pathname.includes('/category/')) return 'category';
  if (pathname.includes('/cart')) return 'cart';
  if (pathname.includes('/search')) return 'search';
  
  return 'home';
}

function countVisibleProducts() {
  try {
    const products = document.querySelectorAll('[data-product-id], .product-item, .product-card');
    return products.length;
  } catch (error) {
    return 0;
  }
}

function countVisitedCategories() {
  try {
    const categories = document.querySelectorAll('[data-category-id], .category-item');
    return categories.length;
  } catch (error) {
    return 0;
  }
}

function generateRecommendations() {
  const intent = determinePrimaryIntent();
  const engagement = calculateEngagement();
  
  const recommendations = [];
  
  if (intent === 'shopping' && engagement === 'high') {
    recommendations.push('Show personalized product recommendations');
    recommendations.push('Offer limited-time deals');
  }
  
  if (intent === 'comparison') {
    recommendations.push('Provide detailed product comparisons');
    recommendations.push('Show customer reviews');
  }
  
  if (intent === 'browsing') {
    recommendations.push('Suggest related categories');
    recommendations.push('Show trending products');
  }
  
  if (engagement === 'low') {
    recommendations.push('Engage with a special offer');
    recommendations.push('Ask for help or preferences');
  }
  
  return recommendations;
}

if (typeof window !== 'undefined') {
  window.__intentAnalyzer = { analyzeUserIntent };
}
Old end */

/**
 * Advanced Intent Analyzer Tool v3.0
 * Comprehensive user behavior analysis and shopping intent prediction system
 * Following ElevenLabs client tools standards for conversational AI integration
 * Includes machine learning models, real-time analytics, and personalization features
 */



/**
 * Advanced Intent Analyzer Tool v3.0
 * Comprehensive user behavior analysis and shopping intent prediction system
 * Following ElevenLabs client tools standards for conversational AI integration
 * Includes machine learning models, real-time analytics, and personalization features
 */

class AdvancedIntentAnalyzer {
  constructor(config = {}) {
    this.config = {
      enableRealTimeAnalysis: true,
      enableMLPredictions: true,
      enablePersonalization: true,
      enableA11yTracking: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      eventBufferSize: 1000,
      analyticsEndpoint: null,
      debugMode: false,
      minConfidenceThreshold: 0.6,
      intentUpdateInterval: 5000, // 5 seconds
      enableHeatmap: true,
      enableScrollDepth: true,
      enableEngagementScore: true,
      ...config
    };

    // Enhanced tracking state
    this.sessionData = {
      sessionId: this.generateSessionId(),
      userId: this.getUserId(),
      sessionStart: Date.now(),
      lastActivity: Date.now(),
      isActive: true,
      deviceInfo: this.getDeviceInfo(),
      browserInfo: this.getBrowserInfo()
    };

    // Event tracking arrays
    this.events = [];
    this.scrollEvents = [];
    this.clickEvents = [];
    this.hoverEvents = [];
    this.searchEvents = [];
    this.formEvents = [];
    this.pageViews = [];
    this.touchEvents = [];

    // Analytics counters
    this.metrics = {
      scrollEvents: 0,
      clickEvents: 0,
      hoverEvents: 0,
      timeOnPage: 0,
      lastActivity: Date.now(),
      maxScrollDepth: 0,
      averageScrollSpeed: 0,
      clickAccuracy: 0,
      formInteractions: 0,
      searchQueries: 0,
      productViews: [],
      categoryViews: [],
      priceRangeViews: [],
      abandonmentPoints: []
    };

    // Machine learning features
    this.mlFeatures = {
      behaviorPattern: null,
      intentHistory: [],
      confidenceScores: [],
      predictionModel: null,
      clusterId: null
    };

    // Real-time intent state
    this.currentIntent = {
      primary: 'unknown',
      secondary: [],
      confidence: 0,
      lastUpdated: Date.now(),
      changeHistory: []
    };

    // Personalization data
    this.personalization = {
      preferences: {},
      visitHistory: [],
      interactionPatterns: {},
      segments: [],
      predictedValue: 0
    };

    this.initializeTracking();
    this.startRealTimeAnalysis();
  }

  // ===== CORE ANALYSIS FUNCTION =====
  async analyzeUserIntent(options = {}) {
    const startTime = performance.now();
    const analysisId = `analysis_${Date.now()}`;
    
    this.log(`🎯 Intent Analyzer: Starting comprehensive analysis`, { analysisId });

    try {
      // Update session metrics
      this.updateSessionMetrics();
      
      // Get current page context
      const pageContext = await this.getEnhancedPageContext();
      
      // Perform multi-dimensional analysis
      const intentAnalysis = await this.performIntentAnalysis();
      const behaviorAnalysis = await this.performBehaviorAnalysis();
      const engagementAnalysis = await this.performEngagementAnalysis();
      const personalizationAnalysis = await this.performPersonalizationAnalysis();
      
      // Machine learning predictions
      const mlPredictions = this.config.enableMLPredictions ? 
        await this.generateMLPredictions() : null;
      
      // Compile comprehensive results
      const analysis = {
        // Core intent data
        intent: {
          primary: intentAnalysis.primary,
          secondary: intentAnalysis.secondary,
          confidence: intentAnalysis.confidence,
          changeHistory: this.currentIntent.changeHistory.slice(-10)
        },
        
        // Behavioral insights
        behavior: {
          pattern: behaviorAnalysis.pattern,
          engagement: engagementAnalysis.level,
          engagementScore: engagementAnalysis.score,
          attentionSpan: behaviorAnalysis.attentionSpan,
          navigationStyle: behaviorAnalysis.navigationStyle,
          decisionStyle: behaviorAnalysis.decisionStyle
        },
        
        // Session analytics
        session: {
          duration: Math.round((Date.now() - this.sessionData.sessionStart) / 1000),
          events: this.events.length,
          pageViews: this.pageViews.length,
          uniqueInteractions: this.getUniqueInteractions(),
          bounceRisk: this.calculateBounceRisk(),
          conversionProbability: this.calculateConversionProbability()
        },
        
        // Detailed metrics
        metrics: {
          scrollDepth: this.calculateScrollDepth(),
          clickHeatmap: this.generateClickHeatmap(),
          timeDistribution: this.calculateTimeDistribution(),
          interactionVelocity: this.calculateInteractionVelocity(),
          focusedElements: this.getMostFocusedElements(),
          abandonmentRisk: this.calculateAbandonmentRisk()
        },
        
        // Page context
        context: {
          pageType: pageContext.type,
          productsViewed: pageContext.products.length,
          categoriesExplored: pageContext.categories.length,
          priceRange: pageContext.priceRange,
          contentDepth: pageContext.contentDepth,
          complexity: pageContext.complexity
        },
        
        // Personalization insights
        personalization: {
          segment: personalizationAnalysis.segment,
          preferences: personalizationAnalysis.preferences,
          predictedValue: personalizationAnalysis.predictedValue,
          recommendationContext: personalizationAnalysis.context
        },
        
        // ML Predictions (if enabled)
        predictions: mlPredictions,
        
        // Actionable recommendations
        recommendations: await this.generateAdvancedRecommendations(intentAnalysis, behaviorAnalysis, engagementAnalysis)
      };
      
      const processingTime = Math.round(performance.now() - startTime);
      
      // Store analysis results
      this.storeAnalysisResults(analysis);
      
      // Send to analytics endpoint if configured
      if (this.config.analyticsEndpoint) {
        await this.sendAnalytics(analysis);
      }
      
      this.log(`✅ Intent analysis completed`, { 
        analysisId, 
        processingTime, 
        intent: analysis.intent.primary,
        confidence: analysis.intent.confidence
      });
      
      return {
        success: true,
        analysis: analysis,
        metadata: {
          analysisId,
          processingTime,
          timestamp: new Date().toISOString(),
          version: '3.0',
          sessionId: this.sessionData.sessionId
        }
      };
      
    } catch (error) {
      const processingTime = Math.round(performance.now() - startTime);
      
      this.log(`❌ Intent analysis failed`, { 
        analysisId, 
        error: error.message, 
        processingTime 
      });
      
      return {
        success: false,
        error: error.message,
        errorType: error.name,
        analysisId,
        processingTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ===== ENHANCED INTENT ANALYSIS =====
  async performIntentAnalysis() {
    const features = this.extractIntentFeatures();
    const patterns = this.analyzePatterns();
    
    // Multi-factor intent scoring
    const intentScores = {
      shopping: this.calculateShoppingIntent(features, patterns),
      browsing: this.calculateBrowsingIntent(features, patterns),
      comparison: this.calculateComparisonIntent(features, patterns),
      research: this.calculateResearchIntent(features, patterns),
      support: this.calculateSupportIntent(features, patterns),
      checkout: this.calculateCheckoutIntent(features, patterns),
      abandoned: this.calculateAbandonmentIntent(features, patterns)
    };
    
    // Find primary intent
    const primaryIntent = Object.entries(intentScores)
      .sort(([,a], [,b]) => b - a)[0];
    
    // Find secondary intents (scores > threshold)
    const secondaryIntents = Object.entries(intentScores)
      .filter(([intent, score]) => intent !== primaryIntent[0] && score > this.config.minConfidenceThreshold)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([intent, score]) => ({ intent, score }));
    
    // Update intent history
    this.updateIntentHistory(primaryIntent[0], primaryIntent[1]);
    
    return {
      primary: primaryIntent[0],
      primaryScore: primaryIntent[1],
      secondary: secondaryIntents,
      confidence: this.calculateOverallConfidence(intentScores),
      features: features,
      patterns: patterns
    };
  }

  calculateShoppingIntent(features, patterns) {
    let score = 0;
    
    // Click patterns
    if (features.clickEvents > 8) score += 0.3;
    if (features.addToCartClicks > 0) score += 0.4;
    if (features.productClicks > 3) score += 0.25;
    
    // Time factors
    if (features.timeOnPage > 120) score += 0.2;
    if (features.avgTimePerProduct > 30) score += 0.15;
    
    // Navigation patterns
    if (patterns.productToProductNavigation > 0.6) score += 0.2;
    if (patterns.categoryDepth > 2) score += 0.15;
    
    // Page types visited
    if (features.cartPageVisits > 0) score += 0.3;
    if (features.checkoutPageVisits > 0) score += 0.5;
    
    // Scroll behavior
    if (features.productScrollTime > 60) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  calculateComparisonIntent(features, patterns) {
    let score = 0;
    
    // Multiple product views
    if (features.uniqueProductViews > 3) score += 0.3;
    if (features.productSwitchRate > 0.4) score += 0.25;
    
    // Tab switching behavior
    if (features.tabSwitches > 2) score += 0.2;
    
    // Time spent comparing
    if (features.comparisonTime > 90) score += 0.2;
    
    // Feature interaction
    if (features.specificationClicks > 2) score += 0.15;
    if (features.reviewClicks > 1) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  // ===== BEHAVIORAL ANALYSIS =====
  async performBehaviorAnalysis() {
    const mousePatterns = this.analyzeMouseBehavior();
    const scrollPatterns = this.analyzeScrollBehavior();
    const clickPatterns = this.analyzeClickBehavior();
    const navigationPatterns = this.analyzeNavigationBehavior();
    
    return {
      pattern: this.classifyBehaviorPattern(mousePatterns, scrollPatterns, clickPatterns),
      attentionSpan: this.calculateAttentionSpan(),
      navigationStyle: navigationPatterns.style,
      decisionStyle: this.classifyDecisionStyle(),
      impulsivity: this.calculateImpulsivity(),
      focusLevel: this.calculateFocusLevel(),
      exploration: navigationPatterns.exploration,
      persistence: this.calculatePersistence()
    };
  }

  analyzeMouseBehavior() {
    // Analyze mouse movement patterns, velocity, acceleration
    const movements = this.getMouseMovements();
    
    return {
      velocity: this.calculateAverageVelocity(movements),
      acceleration: this.calculateAcceleration(movements),
      jitter: this.calculateJitter(movements),
      precision: this.calculateClickPrecision(),
      hesitation: this.detectHesitation(movements),
      confidence: this.calculateMouseConfidence(movements)
    };
  }

  // ===== ENGAGEMENT ANALYSIS =====
  async performEngagementAnalysis() {
    const timeMetrics = this.calculateTimeMetrics();
    const interactionMetrics = this.calculateInteractionMetrics();
    const attentionMetrics = this.calculateAttentionMetrics();
    
    const engagementScore = this.calculateEngagementScore(
      timeMetrics, 
      interactionMetrics, 
      attentionMetrics
    );
    
    return {
      score: engagementScore,
      level: this.classifyEngagementLevel(engagementScore),
      factors: {
        time: timeMetrics,
        interaction: interactionMetrics,
        attention: attentionMetrics
      },
      trends: this.calculateEngagementTrends(),
      quality: this.assessEngagementQuality()
    };
  }

  calculateEngagementScore(timeMetrics, interactionMetrics, attentionMetrics) {
    const timeScore = Math.min(timeMetrics.totalTime / 300, 1) * 0.3; // 5 minutes max
    const interactionScore = Math.min(interactionMetrics.uniqueInteractions / 20, 1) * 0.4;
    const attentionScore = attentionMetrics.focusPercentage * 0.3;
    
    return timeScore + interactionScore + attentionScore;
  }

  // ===== MACHINE LEARNING PREDICTIONS =====
  async generateMLPredictions() {
    const features = this.extractMLFeatures();
    
    return {
      conversionProbability: this.predictConversion(features),
      nextAction: this.predictNextAction(features),
      sessionValue: this.predictSessionValue(features),
      churnRisk: this.predictChurnRisk(features),
      optimalTiming: this.predictOptimalTiming(features),
      personalizedOffers: this.generatePersonalizedOffers(features),
      behaviorCluster: this.classifyBehaviorCluster(features)
    };
  }

  predictConversion(features) {
    // Simple rule-based model (replace with actual ML model)
    let probability = 0.1; // Base probability
    
    if (features.cartInteractions > 0) probability += 0.3;
    if (features.timeOnProductPages > 120) probability += 0.2;
    if (features.priceCheckBehavior > 0.5) probability += 0.15;
    if (features.reviewReadingTime > 30) probability += 0.1;
    if (features.socialProofInteractions > 0) probability += 0.1;
    if (features.urgencySignalResponses > 0) probability += 0.15;
    
    return Math.min(probability, 1.0);
  }

  // ===== PERSONALIZATION ANALYSIS =====
  async performPersonalizationAnalysis() {
    const preferences = this.extractUserPreferences();
    const segment = this.identifyUserSegment();
    const value = this.calculatePredictedValue();
    
    return {
      segment: segment,
      preferences: preferences,
      predictedValue: value,
      context: this.generatePersonalizationContext(),
      recommendations: this.generatePersonalizedRecommendations(preferences, segment)
    };
  }


    extractUserPreferences() {
    const preferences = {
      // Product preferences
      productCategories: this.analyzeProductCategoryPreferences(),
      priceRange: this.analyzePriceRangePreferences(),
      brands: this.analyzeBrandPreferences(),
      
      // Behavioral preferences
      browsingStyle: this.analyzeBrowsingStyle(),
      decisionSpeed: this.analyzeDecisionSpeed(),
      informationDepth: this.analyzeInformationDepth(),
      
      // Interface preferences
      devicePreference: this.getDeviceInfo().type,
      navigationStyle: this.analyzeNavigationPreferences(),
      contentFormat: this.analyzeContentFormatPreferences(),
      
      // Timing preferences
      sessionLength: this.analyzeSessionLengthPreferences(),
      visitFrequency: this.analyzeVisitFrequency(),
      timeOfDay: new Date().getHours(),
      
      // Engagement preferences
      socialProofSensitivity: this.analyzeSocialProofEngagement(),
      urgencySensitivity: this.analyzeUrgencyResponsePatterns(),
      personalizationReceptivity: this.analyzePersonalizationEngagement()
    };
    
    return preferences;
  }

  identifyUserSegment() {
    const features = this.extractSegmentationFeatures();
    
    // Rule-based segmentation (can be replaced with ML clustering)
    const segments = [];
    
    // Behavioral segments
    if (features.highEngagement && features.quickDecision) {
      segments.push('power_shopper');
    }
    
    if (features.longBrowsingTime && features.multipleComparisons) {
      segments.push('researcher');
    }
    
    if (features.lowEngagement && features.quickExit) {
      segments.push('casual_browser');
    }
    
    if (features.priceComparisonBehavior && features.dealSeeking) {
      segments.push('bargain_hunter');
    }
    
    if (features.brandLoyalty && features.repeatVisitor) {
      segments.push('brand_loyalist');
    }
    
    if (features.socialProofEngagement && features.reviewReading) {
      segments.push('social_validator');
    }
    
    // Value-based segments
    if (features.highValueActions && features.premiumInterest) {
      segments.push('high_value');
    }
    
    if (features.mobileUser && features.quickActions) {
      segments.push('mobile_first');
    }
    
    return segments.length > 0 ? segments : ['general'];
  }

  // ===== ADVANCED RECOMMENDATIONS ENGINE =====
  async generateAdvancedRecommendations(intentAnalysis, behaviorAnalysis, engagementAnalysis) {
    const recommendations = [];
    const context = {
      intent: intentAnalysis.primary,
      confidence: intentAnalysis.confidence,
      engagement: engagementAnalysis.level,
      behavior: behaviorAnalysis.pattern
    };
    
    // Intent-based recommendations
    const intentRecommendations = this.generateIntentBasedRecommendations(context);
    recommendations.push(...intentRecommendations);
    
    // Behavioral recommendations
    const behaviorRecommendations = this.generateBehaviorBasedRecommendations(context);
    recommendations.push(...behaviorRecommendations);
    
    // Engagement optimization recommendations
    const engagementRecommendations = this.generateEngagementRecommendations(context);
    recommendations.push(...engagementRecommendations);
    
    // Personalization recommendations
    const personalizationRecommendations = this.generatePersonalizationRecommendations(context);
    recommendations.push(...personalizationRecommendations);
    
    // Conversion optimization recommendations
    const conversionRecommendations = this.generateConversionRecommendations(context);
    recommendations.push(...conversionRecommendations);
    
    // Risk mitigation recommendations
    const riskRecommendations = this.generateRiskMitigationRecommendations(context);
    recommendations.push(...riskRecommendations);
    
    // Prioritize and deduplicate recommendations
    return this.prioritizeRecommendations(recommendations, context);
  }

  generateIntentBasedRecommendations(context) {
    const recommendations = [];
    
    switch (context.intent) {
      case 'shopping':
        if (context.confidence > 0.8) {
          recommendations.push({
            type: 'action',
            priority: 'high',
            category: 'conversion',
            action: 'show_personalized_offers',
            message: 'Present targeted product recommendations and limited-time offers',
            timing: 'immediate',
            expected_impact: 'high'
          });
          
          recommendations.push({
            type: 'ui',
            priority: 'high',
            category: 'optimization',
            action: 'highlight_cart_button',
            message: 'Make add-to-cart and checkout buttons more prominent',
            timing: 'immediate',
            expected_impact: 'medium'
          });
        }
        
        recommendations.push({
          type: 'content',
          priority: 'medium',
          category: 'trust',
          action: 'show_social_proof',
          message: 'Display customer reviews, ratings, and purchase counts',
          timing: 'during_product_view',
          expected_impact: 'medium'
        });
        break;
        
      case 'comparison':
        recommendations.push({
          type: 'tool',
          priority: 'high',
          category: 'assistance',
          action: 'provide_comparison_table',
          message: 'Offer side-by-side product comparison functionality',
          timing: 'immediate',
          expected_impact: 'high'
        });
        
        recommendations.push({
          type: 'content',
          priority: 'medium',
          category: 'information',
          action: 'highlight_key_differences',
          message: 'Emphasize unique selling points and differentiators',
          timing: 'during_comparison',
          expected_impact: 'medium'
        });
        break;
        
      case 'research':
        recommendations.push({
          type: 'content',
          priority: 'high',
          category: 'information',
          action: 'provide_detailed_specs',
          message: 'Show comprehensive product information and specifications',
          timing: 'immediate',
          expected_impact: 'high'
        });
        
        recommendations.push({
          type: 'tool',
          priority: 'medium',
          category: 'assistance',
          action: 'offer_expert_guidance',
          message: 'Provide buying guides, expert reviews, and educational content',
          timing: 'during_research',
          expected_impact: 'medium'
        });
        break;

      case 'browsing':
        recommendations.push({
          type: 'content',
          priority: 'medium',
          category: 'discovery',
          action: 'suggest_trending_products',
          message: 'Show popular and trending items to spark interest',
          timing: 'after_initial_browse',
          expected_impact: 'medium'
        });
        
        recommendations.push({
          type: 'navigation',
          priority: 'medium',
          category: 'discovery',
          action: 'recommend_categories',
          message: 'Suggest relevant product categories based on browsing behavior',
          timing: 'after_page_exploration',
          expected_impact: 'medium'
        });
        break;
        
      case 'support':
        recommendations.push({
          type: 'assistance',
          priority: 'high',
          category: 'support',
          action: 'offer_immediate_help',
          message: 'Proactively offer chat support or FAQ assistance',
          timing: 'immediate',
          expected_impact: 'high'
        });
        break;
        
      case 'checkout':
        recommendations.push({
          type: 'optimization',
          priority: 'critical',
          category: 'conversion',
          action: 'streamline_checkout',
          message: 'Minimize checkout steps and remove friction points',
          timing: 'immediate',
          expected_impact: 'critical'
        });
        
        recommendations.push({
          type: 'trust',
          priority: 'high',
          category: 'security',
          action: 'show_security_badges',
          message: 'Display security certifications and payment guarantees',
          timing: 'during_checkout',
          expected_impact: 'high'
        });
        break;
    }
    
    return recommendations;
  }

  generateBehaviorBasedRecommendations(context) {
    const recommendations = [];
    
    switch (context.behavior) {
      case 'impulsive':
        recommendations.push({
          type: 'urgency',
          priority: 'high',
          category: 'conversion',
          action: 'create_urgency',
          message: 'Show limited-time offers and stock scarcity indicators',
          timing: 'immediate',
          expected_impact: 'high'
        });
        break;
        
      case 'analytical':
        recommendations.push({
          type: 'information',
          priority: 'high',
          category: 'content',
          action: 'provide_detailed_data',
          message: 'Present comprehensive product data, comparisons, and analytics',
          timing: 'immediate',
          expected_impact: 'high'
        });
        break;
        
      case 'social':
        recommendations.push({
          type: 'social_proof',
          priority: 'medium',
          category: 'trust',
          action: 'emphasize_social_elements',
          message: 'Highlight user reviews, social shares, and community features',
          timing: 'throughout_session',
          expected_impact: 'medium'
        });
        break;
        
      case 'price_sensitive':
        recommendations.push({
          type: 'pricing',
          priority: 'high',
          category: 'value',
          action: 'highlight_value_proposition',
          message: 'Show price comparisons, discounts, and value-added benefits',
          timing: 'immediate',
          expected_impact: 'high'
        });
        break;
    }
    
    return recommendations;
  }

  generateEngagementRecommendations(context) {
    const recommendations = [];
    
    if (context.engagement === 'low') {
      recommendations.push({
        type: 'engagement',
        priority: 'critical',
        category: 'retention',
        action: 'interactive_elements',
        message: 'Introduce interactive elements like quizzes, polls, or product configurators',
        timing: 'immediate',
        expected_impact: 'high'
      });
      
      recommendations.push({
        type: 'incentive',
        priority: 'high',
        category: 'retention',
        action: 'offer_incentive',
        message: 'Present exit-intent popups with special offers or content',
        timing: 'on_exit_intent',
        expected_impact: 'medium'
      });
    }
    
    if (context.engagement === 'medium') {
      recommendations.push({
        type: 'progression',
        priority: 'medium',
        category: 'engagement',
        action: 'gamify_experience',
        message: 'Add progress indicators, achievements, or loyalty points',
        timing: 'during_interaction',
        expected_impact: 'medium'
      });
    }
    
    if (context.engagement === 'high') {
      recommendations.push({
        type: 'conversion',
        priority: 'high',
        category: 'optimization',
        action: 'accelerate_conversion',
        message: 'Present premium options, bundles, or exclusive member benefits',
        timing: 'immediate',
        expected_impact: 'high'
      });
    }
    
    return recommendations;
  }

  // ===== REAL-TIME ANALYSIS SYSTEM =====
  startRealTimeAnalysis() {
    if (!this.config.enableRealTimeAnalysis) return;
    
    this.realTimeInterval = setInterval(() => {
      this.performRealTimeUpdate();
    }, this.config.intentUpdateInterval);
    
    this.log('🔄 Real-time analysis started');
  }

  stopRealTimeAnalysis() {
    if (this.realTimeInterval) {
      clearInterval(this.realTimeInterval);
      this.realTimeInterval = null;
      this.log('⏹️ Real-time analysis stopped');
    }
  }

  async performRealTimeUpdate() {
    try {
      const quickAnalysis = await this.performQuickIntentAnalysis();
      
      // Check for significant intent changes
      if (this.hasSignificantIntentChange(quickAnalysis)) {
        await this.handleIntentChange(quickAnalysis);
      }
      
      // Update real-time metrics
      this.updateRealTimeMetrics();
      
      // Trigger real-time recommendations if needed
      if (this.shouldTriggerRealTimeRecommendations(quickAnalysis)) {
        await this.triggerRealTimeRecommendations(quickAnalysis);
      }
      
    } catch (error) {
      this.log('❌ Real-time analysis error:', error.message);
    }
  }

  // ===== ADVANCED METRICS CALCULATION =====
  calculateScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const maxScroll = documentHeight - windowHeight;
    const scrollDepth = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
    
    return {
      current: Math.round(scrollDepth),
      maximum: Math.round(this.metrics.maxScrollDepth),
      average: this.calculateAverageScrollDepth(),
      velocity: this.calculateScrollVelocity(),
      patterns: this.analyzeScrollPatterns()
    };
  }

  calculateInteractionVelocity() {
    const timeWindow = 60000; // 1 minute
    const now = Date.now();
    const recentEvents = this.events.filter(event => 
      now - event.timestamp < timeWindow
    );
    
    return {
      eventsPerMinute: recentEvents.length,
      clicksPerMinute: recentEvents.filter(e => e.type === 'click').length,
      scrollsPerMinute: recentEvents.filter(e => e.type === 'scroll').length,
      trend: this.calculateVelocityTrend()
    };
  }

  calculateConversionProbability() {
    const features = this.extractConversionFeatures();
    
    // Simple scoring model (replace with trained ML model)
    let probability = 0.1; // Base probability
    
    // Time-based factors
    if (features.timeOnSite > 300) probability += 0.2; // 5+ minutes
    if (features.pageDepth > 3) probability += 0.15;
    
    // Engagement factors
    if (features.productViews > 2) probability += 0.2;
    if (features.cartInteraction) probability += 0.3;
    if (features.checkoutPageVisit) probability += 0.4;
    
    // Behavioral factors
    if (features.returnVisitor) probability += 0.1;
    if (features.socialProofEngagement) probability += 0.1;
    if (features.urgencyResponse) probability += 0.15;
    
    return Math.min(probability, 1.0);
  }

  calculateAbandonmentRisk() {
    const riskFactors = [];
    const now = Date.now();
    
    // Time-based risk factors
    const timeSinceLastActivity = now - this.metrics.lastActivity;
    if (timeSinceLastActivity > 30000) { // 30 seconds
      riskFactors.push({
        factor: 'inactivity',
        weight: 0.3,
        description: 'User has been inactive for extended period'
      });
    }
    
    // Engagement-based risk factors
    if (this.metrics.clickEvents < 2 && this.sessionData.sessionStart + 60000 < now) {
      riskFactors.push({
        factor: 'low_engagement',
        weight: 0.2,
        description: 'Low interaction after reasonable time on site'
      });
    }
    
    // Navigation-based risk factors
    const backButtonClicks = this.events.filter(e => e.type === 'navigation' && e.direction === 'back').length;
    if (backButtonClicks > 1) {
      riskFactors.push({
        factor: 'navigation_confusion',
        weight: 0.25,
        description: 'Multiple back button uses suggest navigation issues'
      });
    }
    
    // Cart abandonment specific risks
    const cartEvents = this.events.filter(e => e.type === 'cart');
    if (cartEvents.length > 0 && !this.hasRecentCheckoutActivity()) {
      riskFactors.push({
        factor: 'cart_abandonment',
        weight: 0.4,
        description: 'Items added to cart but no checkout progress'
      });
    }
    
    const totalRisk = riskFactors.reduce((sum, factor) => sum + factor.weight, 0);
    
    return {
      riskScore: Math.min(totalRisk, 1.0),
      riskLevel: this.classifyRiskLevel(totalRisk),
      factors: riskFactors,
      interventionRecommended: totalRisk > 0.5
    };
  }

  // ===== EVENT TRACKING SYSTEM =====
  trackEvent(eventType, eventData) {
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: eventType,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId,
      url: window.location.href,
      ...eventData
    };
        this.events.push(event);
    
    // Maintain event buffer size
    if (this.events.length > this.config.eventBufferSize) {
      this.events.shift();
    }
    
    // Update specific event arrays
    this.updateEventCounters(event);
    
    // Real-time processing
    if (this.config.enableRealTimeAnalysis) {
      this.processEventRealTime(event);
    }
    
    // Analytics integration
    if (this.config.enableAnalytics) {
      this.sendEventToAnalytics(event);
    }
  }

  updateEventCounters(event) {
    switch (event.type) {
      case 'scroll':
        this.scrollEvents.push(event);
        this.metrics.scrollEvents++;
        this.updateScrollMetrics(event);
        break;
        
      case 'click':
        this.clickEvents.push(event);
        this.metrics.clickEvents++;
        this.updateClickMetrics(event);
        break;
        
      case 'hover':
        this.hoverEvents.push(event);
        this.metrics.hoverEvents++;
        break;
        
      case 'search':
        this.searchEvents.push(event);
        this.metrics.searchQueries++;
        break;
        
      case 'form':
        this.formEvents.push(event);
        this.metrics.formInteractions++;
        break;
        
      case 'touch':
        this.touchEvents.push(event);
        this.updateTouchMetrics(event);
        break;
    }
    
    // Update last activity
    this.metrics.lastActivity = event.timestamp;
  }

  // ===== ADVANCED ANALYTICS =====
  generateHeatmapData() {
    const heatmapData = {
      clicks: this.generateClickHeatmap(),
      hovers: this.generateHoverHeatmap(),
      scrolling: this.generateScrollHeatmap(),
      attention: this.generateAttentionHeatmap()
    };
    
    return {
      success: true,
      heatmapData: heatmapData,
      generatedAt: new Date().toISOString(),
      sessionId: this.sessionData.sessionId
    };
  }

  generateClickHeatmap() {
    const clickData = {};
    
    this.clickEvents.forEach(event => {
      const selector = event.target || 'unknown';
      const coordinates = event.coordinates || { x: 0, y: 0 };
      
      if (!clickData[selector]) {
        clickData[selector] = {
          selector: selector,
          clicks: 0,
          coordinates: [],
          elementType: event.elementType,
          elementText: event.elementText
        };
      }
      
      clickData[selector].clicks++;
      clickData[selector].coordinates.push(coordinates);
    });
    
    // Convert to array and sort by click count
    return Object.values(clickData)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 20); // Top 20 most clicked elements
  }

  generateAttentionHeatmap() {
    const attentionData = {};
    
    // Analyze time spent on different page sections
    this.events.forEach(event => {
      if (event.type === 'viewport_change' || event.type === 'scroll') {
        const section = this.identifyPageSection(event.scrollPosition);
        
        if (!attentionData[section]) {
          attentionData[section] = {
            section: section,
            timeSpent: 0,
            interactions: 0,
            averageTime: 0
          };
        }
        
        attentionData[section].timeSpent += event.duration || 1000; // Default 1 second
        attentionData[section].interactions++;
      }
    });
    
    // Calculate average time per section
    Object.values(attentionData).forEach(section => {
      section.averageTime = section.timeSpent / section.interactions;
    });
    
    return Object.values(attentionData)
      .sort((a, b) => b.timeSpent - a.timeSpent);
  }

  // ===== PREDICTIVE ANALYTICS =====
  async generatePredictiveInsights() {
    const insights = {
      nextAction: await this.predictNextAction(),
      sessionOutcome: await this.predictSessionOutcome(),
      conversionTiming: await this.predictOptimalConversionTiming(),
      churnRisk: await this.predictChurnRisk(),
      lifetimeValue: await this.predictLifetimeValue(),
      recommendedInterventions: await this.predictOptimalInterventions()
    };
    
    return {
      success: true,
      insights: insights,
      confidence: this.calculatePredictionConfidence(insights),
      generatedAt: new Date().toISOString(),
      modelVersion: '3.0'
    };
  }

  async predictNextAction() {
    const recentBehavior = this.analyzeRecentBehavior();
    const patterns = this.identifyBehaviorPatterns();
    
    const actionProbabilities = {
      'add_to_cart': this.calculateActionProbability('add_to_cart', recentBehavior, patterns),
      'view_product': this.calculateActionProbability('view_product', recentBehavior, patterns),
      'search': this.calculateActionProbability('search', recentBehavior, patterns),
      'navigate_category': this.calculateActionProbability('navigate_category', recentBehavior, patterns),
      'checkout': this.calculateActionProbability('checkout', recentBehavior, patterns),
      'exit_site': this.calculateActionProbability('exit_site', recentBehavior, patterns)
    };
    
    // Find most likely action
    const mostLikelyAction = Object.entries(actionProbabilities)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      predictedAction: mostLikelyAction[0],
      probability: mostLikelyAction[1],
      allProbabilities: actionProbabilities,
      confidence: this.calculateActionPredictionConfidence(actionProbabilities),
      timeframe: this.predictActionTimeframe(mostLikelyAction[0])
    };
  }

  async predictSessionOutcome() {
    const features = this.extractSessionFeatures();
    
    const outcomeProbabilities = {
      'conversion': this.calculateConversionProbability(),
      'bounce': this.calculateBounceProbability(),
      'engagement': this.calculateEngagementContinuationProbability(),
      'abandonment': this.calculateAbandonmentProbability()
    };
    
    const mostLikelyOutcome = Object.entries(outcomeProbabilities)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      predictedOutcome: mostLikelyOutcome[0],
      probability: mostLikelyOutcome[1],
      allOutcomes: outcomeProbabilities,
      factors: this.identifyOutcomeFactors(mostLikelyOutcome[0]),
      recommendations: this.generateOutcomeOptimizationRecommendations(mostLikelyOutcome[0])
    };
  }

  // ===== PERSONALIZATION ENGINE =====
  async generatePersonalizedExperience() {
    const userProfile = await this.buildUserProfile();
    const contextualFactors = this.getContextualFactors();
    
    return {
      contentRecommendations: this.generateContentRecommendations(userProfile, contextualFactors),
      productRecommendations: this.generateProductRecommendations(userProfile, contextualFactors),
      uiCustomizations: this.generateUICustomizations(userProfile, contextualFactors),
      messagingPersonalization: this.generatePersonalizedMessaging(userProfile, contextualFactors),
      offerPersonalization: this.generatePersonalizedOffers(userProfile, contextualFactors)
    };
  }

  buildUserProfile() {
    return {
      demographics: this.inferDemographics(),
      interests: this.extractInterests(),
      preferences: this.extractUserPreferences(),
      behaviorSegment: this.identifyUserSegment(),
      purchaseHistory: this.analyzePurchaseHistory(),
      engagementHistory: this.analyzeEngagementHistory(),
      devicePreferences: this.analyzeDevicePreferences(),
      timePreferences: this.analyzeTimePreferences()
    };
  }

  // ===== ADVANCED REPORTING =====
  generateComprehensiveReport() {
    return {
      executiveSummary: this.generateExecutiveSummary(),
      intentAnalysis: this.generateIntentReport(),
      behaviorAnalysis: this.generateBehaviorReport(),
      engagementAnalysis: this.generateEngagementReport(),
      conversionAnalysis: this.generateConversionReport(),
      recommendationsReport: this.generateRecommendationsReport(),
      predictiveInsights: this.generatePredictiveReport(),
      actionItems: this.generateActionItems(),
      
      metadata: {
        reportId: `report_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        sessionId: this.sessionData.sessionId,
        dataQuality: this.assessDataQuality(),
        confidenceLevel: this.calculateOverallConfidence()
      }
    };
  }

  generateExecutiveSummary() {
    const sessionDuration = Math.round((Date.now() - this.sessionData.sessionStart) / 1000);
    const primaryIntent = this.currentIntent.primary;
    const engagementLevel = this.calculateEngagementLevel();
    const conversionProbability = this.calculateConversionProbability();
    
    return {
      keyInsights: [
        `User shows ${primaryIntent} intent with ${Math.round(this.currentIntent.confidence * 100)}% confidence`,
        `${engagementLevel} engagement level maintained throughout session`,
        `${Math.round(conversionProbability * 100)}% probability of conversion`,
        `${sessionDuration} seconds spent on site with ${this.events.length} total interactions`
      ],
      
      recommendations: this.getTopRecommendations(3),
      
      metrics: {
        sessionDuration,
        totalInteractions: this.events.length,
        engagementScore: this.calculateEngagementScore(),
        intentConfidence: this.currentIntent.confidence,
        conversionProbability
      }
    };
  }

  // ===== INITIALIZATION AND SETUP =====
  initializeTracking() {
    this.setupEventListeners();
    this.startSessionTracking();
    this.initializeObservers();
    
    this.log('✅ Intent Analyzer initialized', {
      sessionId: this.sessionData.sessionId,
      config: this.config
    });
  }

  setupEventListeners() {
    // Enhanced scroll tracking
    document.addEventListener('scroll', (event) => {
      this.trackEvent('scroll', {
        scrollTop: window.pageYOffset,
        scrollLeft: window.pageXOffset,
        scrollHeight: document.documentElement.scrollHeight,
        windowHeight: window.innerHeight,
        scrollDepth: this.calculateCurrentScrollDepth(),
        direction: this.getScrollDirection(),
        velocity: this.calculateScrollVelocity()
      });
    }, { passive: true });

    // Enhanced click tracking
    document.addEventListener('click', (event) => {
      this.trackEvent('click', {
        target: this.generateElementSelector(event.target),
        coordinates: { x: event.clientX, y: event.clientY },
        elementType: event.target.tagName,
        elementText: event.target.textContent?.trim().substring(0, 100),
        elementId: event.target.id,
        elementClass: event.target.className,
        clickType: event.detail === 1 ? 'single' : 'multiple',
        modifiers: {
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
          alt: event.altKey,
          meta: event.metaKey
        }
      });
    }, { passive: true });

    // Mouse movement tracking
    let mouseTrackingTimeout;
    document.addEventListener('mousemove', (event) => {
      clearTimeout(mouseTrackingTimeout);
      mouseTrackingTimeout = setTimeout(() => {
        this.trackEvent('mouse_move', {
          coordinates: { x: event.clientX, y: event.clientY },
          target: this.generateElementSelector(event.target),
          timestamp: Date.now()
        });
      }, 100); // Throttle to avoid too many events
    }, { passive: true });

    // Form interaction tracking
    document.addEventListener('input', (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
        this.trackEvent('form', {
          action: 'input',
          fieldType: event.target.type,
          fieldName: event.target.name,
          fieldId: event.target.id,
          valueLength: event.target.value?.length || 0
        });
      }
    }, { passive: true });

    // Page visibility tracking
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('visibility_change', {
        hidden: document.hidden,
        visibilityState: document.visibilityState
      });
    });

    // Touch events (mobile)
    document.addEventListener('touchstart', (event) => {
      this.trackEvent('touch', {
        action: 'start',
        touches: event.touches.length,
        target: this.generateElementSelector(event.target)
      });
    }, { passive: true });

    // Keyboard events
    document.addEventListener('keydown', (event) => {
      this.trackEvent('keyboard', {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey
      });
    }, { passive: true });
  }

  // ===== UTILITY METHODS =====
  generateElementSelector(element) {
    if (!element) return 'unknown';
    
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
    
    selectors.push(element.tagName.toLowerCase());
    
    return selectors[0] || 'unknown';
  }

  log(message, data = {}) {
    if (this.config.debugMode) {
      console.log(`[IntentAnalyzer] ${message}`, data);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getDeviceInfo() {
    return {
      type: this.detectDeviceType(),
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      pixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window,
      orientation: screen.orientation?.type || 'unknown'
    };
  }

  detectDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      return 'mobile';
    }
    
    if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet';
    }
    
    return 'desktop';
  }

  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      vendor: navigator.vendor
    };
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getUserId() {
    // Try to get user ID from various sources
    return localStorage.getItem('userId') || 
           sessionStorage.getItem('userId') || 
           this.generateAnonymousUserId();
  }

  generateAnonymousUserId() {
    const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('userId', anonymousId);
    return anonymousId;
  }
}

// ===== GLOBAL INTENT ANALYZER FUNCTIONS =====

// Enhanced global analysis function
async function analyzeUserIntent(options = {}) {
  try {
    // Initialize global analyzer if not exists
    if (!window.__advancedIntentAnalyzer) {
      window.__advancedIntentAnalyzer = new AdvancedIntentAnalyzer({
        debugMode: true,
        enableRealTimeAnalysis: true,
        enableMLPredictions: true,
        enablePersonalization: true,
        ...options
      });
    }

    return await window.__advancedIntentAnalyzer.analyzeUserIntent(options);
    
  } catch (error) {
    console.error('❌ Intent analysis system error:', error);
    
    // Fallback to basic analysis
    return {
      success: false,
      error: error.message,
      fallback: true,
      basicAnalysis: getBasicIntentAnalysis()
    };
  }
}

// Fallback basic analysis
function getBasicIntentAnalysis() {
  const timeOnPage = (Date.now() - (window.__intentStartTime || Date.now())) / 1000;
  
  return {
    intent: {
      primary: timeOnPage > 60 ? 'shopping' : 'browsing',
      confidence: 0.5
    },
    session: {
      duration: Math.round(timeOnPage)
    },
    
        recommendations: [
      'Monitor user engagement',
      'Provide relevant content',
      'Track conversion opportunities'
    ]
  };
}

// Real-time intent tracking
function startIntentTracking(options = {}) {
  if (!window.__advancedIntentAnalyzer) {
    window.__advancedIntentAnalyzer = new AdvancedIntentAnalyzer(options);
  }
  
  return {
    success: true,
    message: 'Intent tracking started',
    sessionId: window.__advancedIntentAnalyzer.sessionData.sessionId
  };
}

// Stop intent tracking
function stopIntentTracking() {
  if (window.__advancedIntentAnalyzer) {
    window.__advancedIntentAnalyzer.stopRealTimeAnalysis();
    return {
      success: true,
      message: 'Intent tracking stopped'
    };
  }
  
  return {
    success: false,
    error: 'Intent tracking not active'
  };
}

// Get real-time intent data
function getCurrentIntent() {
  if (!window.__advancedIntentAnalyzer) {
    return {
      success: false,
      error: 'Intent analyzer not initialized'
    };
  }
  
  return {
    success: true,
    intent: window.__advancedIntentAnalyzer.currentIntent,
    metrics: {
      sessionDuration: Date.now() - window.__advancedIntentAnalyzer.sessionData.sessionStart,
      totalEvents: window.__advancedIntentAnalyzer.events.length,
      engagementLevel: window.__advancedIntentAnalyzer.calculateEngagementLevel()
    }
  };
}

// Generate heatmap data
function generateHeatmapData(options = {}) {
  if (!window.__advancedIntentAnalyzer) {
    return {
      success: false,
      error: 'Intent analyzer not initialized'
    };
  }
  
  return window.__advancedIntentAnalyzer.generateHeatmapData();
}

// Get predictive insights
async function getPredictiveInsights() {
  if (!window.__advancedIntentAnalyzer) {
    return {
      success: false,
      error: 'Intent analyzer not initialized'
    };
  }
  
  return await window.__advancedIntentAnalyzer.generatePredictiveInsights();
}

// Generate personalized experience
async function getPersonalizedExperience() {
  if (!window.__advancedIntentAnalyzer) {
    return {
      success: false,
      error: 'Intent analyzer not initialized'
    };
  }
  
  return await window.__advancedIntentAnalyzer.generatePersonalizedExperience();
}

// Get comprehensive report
function getIntentReport() {
  if (!window.__advancedIntentAnalyzer) {
    return {
      success: false,
      error: 'Intent analyzer not initialized'
    };
  }
  
  return window.__advancedIntentAnalyzer.generateComprehensiveReport();
}

// Track custom event
function trackCustomEvent(eventType, eventData = {}) {
  if (!window.__advancedIntentAnalyzer) {
    return {
      success: false,
      error: 'Intent analyzer not initialized'
    };
  }
  
  window.__advancedIntentAnalyzer.trackEvent(eventType, eventData);
  
  return {
    success: true,
    message: `Custom event '${eventType}' tracked`
  };
}

// Set user preferences
function setUserPreferences(preferences = {}) {
  if (!window.__advancedIntentAnalyzer) {
    return {
      success: false,
      error: 'Intent analyzer not initialized'
    };
  }
  
  // Store preferences in personalization data
  window.__advancedIntentAnalyzer.personalization.preferences = {
    ...window.__advancedIntentAnalyzer.personalization.preferences,
    ...preferences
  };
  
  return {
    success: true,
    message: 'User preferences updated',
    preferences: window.__advancedIntentAnalyzer.personalization.preferences
  };
}

// Get conversion optimization recommendations
async function getConversionOptimization() {
  if (!window.__advancedIntentAnalyzer) {
    return {
      success: false,
      error: 'Intent analyzer not initialized'
    };
  }
  
  const intentAnalysis = await window.__advancedIntentAnalyzer.performIntentAnalysis();
  const behaviorAnalysis = await window.__advancedIntentAnalyzer.performBehaviorAnalysis();
  const engagementAnalysis = await window.__advancedIntentAnalyzer.performEngagementAnalysis();
  
  const recommendations = await window.__advancedIntentAnalyzer.generateConversionRecommendations({
    intent: intentAnalysis.primary,
    confidence: intentAnalysis.confidence,
    engagement: engagementAnalysis.level,
    behavior: behaviorAnalysis.pattern
  });
  
  return {
    success: true,
    recommendations: recommendations,
    conversionProbability: window.__advancedIntentAnalyzer.calculateConversionProbability(),
    optimizationPotential: window.__advancedIntentAnalyzer.calculateOptimizationPotential()
  };
}

// Export all functions for global use
if (typeof window !== 'undefined') {
  // Set intent start time for fallback analysis
  window.__intentStartTime = Date.now();
  
  window.__intentAnalyzer = {
    // Core functions
    analyzeUserIntent,
    startIntentTracking,
    stopIntentTracking,
    getCurrentIntent,
    
    // Advanced analytics
    generateHeatmapData,
    getPredictiveInsights,
    getPersonalizedExperience,
    getIntentReport,
    getConversionOptimization,
    
    // Event tracking
    trackCustomEvent,
    setUserPreferences,
    
    // Utility functions
    getSessionMetrics: () => {
      if (!window.__advancedIntentAnalyzer) return { success: false, error: 'Not initialized' };
      return {
        success: true,
        metrics: {
          sessionId: window.__advancedIntentAnalyzer.sessionData.sessionId,
          sessionDuration: Date.now() - window.__advancedIntentAnalyzer.sessionData.sessionStart,
          totalEvents: window.__advancedIntentAnalyzer.events.length,
          currentIntent: window.__advancedIntentAnalyzer.currentIntent
        }
      };
    },
    
    getEngagementMetrics: () => {
      if (!window.__advancedIntentAnalyzer) return { success: false, error: 'Not initialized' };
      return window.__advancedIntentAnalyzer.performEngagementAnalysis();
    },
    
    getBehaviorMetrics: () => {
      if (!window.__advancedIntentAnalyzer) return { success: false, error: 'Not initialized' };
      return window.__advancedIntentAnalyzer.performBehaviorAnalysis();
    }
  };
  
  // Auto-initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startIntentTracking({ 
        enableRealTimeAnalysis: true,
        enableMLPredictions: true,
        debugMode: false 
      });
    });
  } else {
    startIntentTracking({ 
      enableRealTimeAnalysis: true,
      enableMLPredictions: true,
      debugMode: false 
    });
  }
}

