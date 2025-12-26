// ✅ WORKING Browser Login Script
// Copy and paste this entire code into browser console at http://localhost:3000

async function loginSimple(email, password) {
  console.log('🔐 Logging in...');
  try {
    const r = await fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation SignIn($email: String!, $password: String!) {
          signIn(email: $email, password: $password) {
            tokens {
              accessOrWorkspaceAgnosticToken { token expiresAt }
              refreshToken { token expiresAt }
            }
          }
        }`,
        variables: { email, password }
      })
    });
    const d = await r.json();
    if (d.data?.signIn?.tokens) {
      const tokenPair = {
        accessOrWorkspaceAgnosticToken: d.data.signIn.tokens.accessOrWorkspaceAgnosticToken,
        refreshToken: d.data.signIn.tokens.refreshToken
      };
      document.cookie = `tokenPair=${encodeURIComponent(JSON.stringify(tokenPair))}; path=/; sameSite=lax; max-age=2592000`;
      console.log('✅ Login successful! Reloading...');
      window.location.reload();
    } else {
      console.error('❌ Login failed:', d.errors);
      alert('Login failed: ' + (d.errors?.[0]?.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error: ' + error.message);
  }
}

window.loginSimple = loginSimple;
console.log('✅ Ready! Run: loginSimple("admin@successtest.com", "password123")');


