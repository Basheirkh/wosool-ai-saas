/**
 * Browser Login Script for Multi-Tenant Access
 * 
 * This script allows you to login to Twenty CRM using tenant-manager credentials
 * directly in the browser console.
 * 
 * Usage:
 * 1. Open http://localhost:3000
 * 2. Press F12 (Developer Console)
 * 3. Copy and paste this entire file
 * 4. Run: loginToTenant('admin@successtest.com', 'password123')
 */

async function loginToTenant(email, password) {
  console.log('🔐 Logging in to tenant...');
  
  try {
    // Step 1: Login via tenant-manager API
    console.log('📡 Step 1: Authenticating with tenant-manager...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      throw new Error(`Login failed: ${error.message || 'Unknown error'}`);
    }

    const loginData = await loginResponse.json();
    const tenantId = loginData.data.tenant_id;
    const userId = loginData.data.user.id;
    
    console.log('✅ Authenticated with tenant-manager');
    console.log(`   Tenant ID: ${tenantId}`);
    console.log(`   User ID: ${userId}`);

    // Step 2: Get tenant workspace info
    console.log('📡 Step 2: Getting workspace information...');
    const tenantResponse = await fetch(`http://localhost:3001/api/admin/tenants`, {
      headers: {
        'Authorization': `Bearer ${loginData.data.access_token}`,
        'X-Admin-Key': 'change-this-to-a-strong-random-key-in-production', // You may need to update this
      },
    });

    // Step 3: Try to login via Twenty CRM GraphQL
    // Note: This will only work if the user exists in the template database
    console.log('📡 Step 3: Attempting Twenty CRM login...');
    
    const graphqlResponse = await fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation SignIn($email: String!, $password: String!) {
            signIn(email: $email, password: $password) {
              tokens {
                accessOrWorkspaceAgnosticToken {
                  token
                  expiresAt
                }
                refreshToken {
                  token
                  expiresAt
                }
              }
            }
          }
        `,
        variables: {
          email: email,
          password: password,
        },
      }),
    });

    const graphqlData = await graphqlResponse.json();

    if (graphqlData.errors) {
      console.warn('⚠️  Twenty CRM GraphQL login failed:', graphqlData.errors);
      console.log('💡 This is expected - user may not exist in template database');
      console.log('💡 Using token bridge approach...');
      
      // Fallback: Create a token bridge format
      // Note: This won't work for API calls, but might help with UI
      return await createTokenBridge(loginData.data.access_token, tenantId, userId);
    }

    if (graphqlData.data?.signIn?.tokens) {
      console.log('✅ Twenty CRM login successful!');
      const tokens = graphqlData.data.signIn.tokens;
      
      // Set tokenPair in cookie
      const tokenPair = {
        accessOrWorkspaceAgnosticToken: tokens.accessOrWorkspaceAgnosticToken,
        refreshToken: tokens.refreshToken,
      };
      
      document.cookie = `tokenPair=${encodeURIComponent(JSON.stringify(tokenPair))}; path=/; sameSite=lax; max-age=2592000`;
      console.log('✅ Token pair set in cookie');
      console.log('🔄 Reloading page...');
      window.location.reload();
      return tokens;
    }

    throw new Error('Unexpected response from Twenty CRM');
    
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    console.error('Full error:', error);
    
    // Show helpful message
    alert(`Login failed: ${error.message}\n\nNote: This may be because:\n1. User doesn't exist in template database\n2. Password mismatch\n3. Network error\n\nTry using the tenant-manager API directly.`);
    
    return null;
  }
}

async function createTokenBridge(tenantToken, tenantId, userId) {
  console.log('🔧 Creating token bridge...');
  console.warn('⚠️  This is a workaround - full functionality may be limited');
  
  // Create a token-like structure (won't work for API, but might help UI)
  const bridgeToken = {
    accessOrWorkspaceAgnosticToken: {
      token: tenantToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    refreshToken: {
      token: tenantToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };
  
  // Store in cookie (may not work due to token format)
  document.cookie = `tokenPair=${encodeURIComponent(JSON.stringify(bridgeToken))}; path=/; sameSite=lax; max-age=2592000`;
  
  console.log('⚠️  Token bridge created, but may not work due to token format incompatibility');
  console.log('💡 Recommendation: Use tenant-manager API directly or implement proper token bridge');
  
  return bridgeToken;
}

// Helper function to list available tenants
async function listTenants() {
  try {
    const response = await fetch('http://localhost:3001/');
    const data = await response.json();
    console.log('📋 Available API endpoints:', data);
    
    // Try to get tenants (requires admin key)
    console.log('\n💡 To get tenant list, use:');
    console.log('   curl http://localhost:3001/api/admin/tenants -H "X-Admin-Key: YOUR_KEY"');
  } catch (error) {
    console.error('Failed to fetch API info:', error);
  }
}

// Export functions for console use
window.loginToTenant = loginToTenant;
window.listTenants = listTenants;

console.log('✅ Browser login functions loaded!');
console.log('📖 Usage:');
console.log('   loginToTenant("admin@successtest.com", "password123")');
console.log('   listTenants()');


