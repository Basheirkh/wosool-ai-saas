/**
 * Clerk Browser Integration for Twenty CRM
 * 
 * This script bridges Clerk authentication with Twenty CRM
 * 
 * Usage:
 * 1. User authenticates via Clerk (your main page)
 * 2. After Clerk login, call: connectClerkToTwentyCRM()
 * 3. Script converts Clerk token → Twenty CRM token
 * 4. Sets tokenPair cookie
 * 5. Redirects to Twenty CRM
 */

/**
 * Main function to connect Clerk authentication to Twenty CRM
 * 
 * @param {string} clerkToken - Clerk JWT token (from Clerk.getToken())
 */
async function connectClerkToTwentyCRM(clerkToken) {
  if (!clerkToken) {
    console.error('❌ No Clerk token provided');
    console.log('💡 Get token using: const token = await window.Clerk?.session?.getToken()');
    return null;
  }

  console.log('🔐 Converting Clerk token to Twenty CRM token...');

  try {
    // Step 1: Convert Clerk token to Twenty CRM token
    const response = await fetch('http://localhost:3001/api/clerk/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkToken: clerkToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Token conversion failed');
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error('Invalid response from token bridge');
    }

    console.log('✅ Token converted successfully');

    // Step 2: Set tokenPair cookie for Twenty CRM
    const tokenPair = {
      accessOrWorkspaceAgnosticToken: result.data.accessOrWorkspaceAgnosticToken,
      refreshToken: result.data.refreshToken,
    };

    document.cookie = `tokenPair=${encodeURIComponent(JSON.stringify(tokenPair))}; path=/; sameSite=lax; max-age=2592000`;
    
    console.log('✅ Token set in cookie');
    console.log('🔄 Redirecting to Twenty CRM...');

    // Step 3: Redirect to Twenty CRM
    window.location.href = 'http://localhost:3000';

    return tokenPair;
  } catch (error) {
    console.error('❌ Error connecting to Twenty CRM:', error.message);
    console.error('Full error:', error);
    
    alert(`Failed to connect to Twenty CRM: ${error.message}\n\nMake sure:\n1. Tenant-manager is running\n2. Clerk token is valid\n3. User has a tenant organization`);
    
    return null;
  }
}

/**
 * Auto-connect if Clerk is already authenticated
 * Call this after page load if Clerk session exists
 */
async function autoConnectIfClerkAuthenticated() {
  // Check if Clerk is available
  if (typeof window.Clerk === 'undefined') {
    console.log('ℹ️  Clerk not loaded yet');
    return;
  }

  try {
    const session = await window.Clerk.session;
    if (session) {
      const token = await session.getToken();
      if (token) {
        console.log('✅ Clerk session found, connecting to Twenty CRM...');
        await connectClerkToTwentyCRM(token);
      }
    }
  } catch (error) {
    console.log('ℹ️  No active Clerk session');
  }
}

/**
 * Verify Clerk token and get tenant info
 */
async function verifyClerkToken(clerkToken) {
  try {
    const response = await fetch('http://localhost:3001/api/clerk/auth/verify', {
      headers: {
        'Authorization': `Bearer ${clerkToken}`,
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Verification failed:', error);
    return null;
  }
}

// Make functions available globally
window.connectClerkToTwentyCRM = connectClerkToTwentyCRM;
window.autoConnectIfClerkAuthenticated = autoConnectIfClerkAuthenticated;
window.verifyClerkToken = verifyClerkToken;

console.log('✅ Clerk integration functions loaded!');
console.log('📖 Usage:');
console.log('   connectClerkToTwentyCRM(clerkToken)');
console.log('   autoConnectIfClerkAuthenticated()');
console.log('   verifyClerkToken(clerkToken)');

// Auto-connect if on main page and Clerk is ready
if (window.location.hostname === 'localhost' && window.location.port !== '3000') {
  // Wait for Clerk to load
  if (window.Clerk) {
    autoConnectIfClerkAuthenticated();
  } else {
    window.addEventListener('clerk-loaded', () => {
      autoConnectIfClerkAuthenticated();
    });
  }
}


