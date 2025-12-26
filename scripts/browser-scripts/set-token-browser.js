/**
 * Browser script to set Twenty CRM tokenPair
 * 
 * Copy and paste this entire script into browser console at http://localhost:3000
 * 
 * Usage:
 * 1. Get your access token from tenant-manager API
 * 2. Replace YOUR_ACCESS_TOKEN_HERE with your actual token
 * 3. Paste this script in browser console (F12)
 * 4. Press Enter
 */

(function() {
  // Replace this with your actual access token
  const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE';
  
  if (ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
    console.error('❌ Please replace YOUR_ACCESS_TOKEN_HERE with your actual token!');
    console.log('Get token by running: ./access-tenant.sh <email> <password>');
    return;
  }

  // Calculate expiration dates (7 days for access, 30 days for refresh)
  const accessExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Create tokenPair in the format Twenty CRM expects
  const tokenPair = {
    accessOrWorkspaceAgnosticToken: {
      token: ACCESS_TOKEN,
      expiresAt: accessExpiresAt
    },
    refreshToken: {
      token: ACCESS_TOKEN,
      expiresAt: refreshExpiresAt
    }
  };

  // Set cookie (Twenty CRM uses cookie storage, not localStorage)
  const cookieValue = encodeURIComponent(JSON.stringify(tokenPair));
  document.cookie = `tokenPair=${cookieValue}; path=/; sameSite=lax; max-age=2592000`;
  
  console.log('✅ Token pair set successfully!');
  console.log('🔄 Reloading page...');
  
  // Reload the page
  window.location.reload();
})();


