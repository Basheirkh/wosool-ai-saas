/**
 * Simple Browser Login - Direct GraphQL Approach
 * 
 * This works if the user exists in the template database.
 * 
 * Usage in browser console (F12):
 *   loginSimple('admin@successtest.com', 'password123')
 */

async function loginSimple(email, password) {
  console.log('🔐 Logging in via Twenty CRM GraphQL...');
  
  try {
    const response = await fetch('http://localhost:3000/graphql', {
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

    const data = await response.json();

    if (data.errors) {
      console.error('❌ Login failed:', data.errors);
      if (data.errors[0]?.message?.includes('Invalid') || data.errors[0]?.message?.includes('password')) {
        console.log('💡 User may not exist in template database or password is incorrect');
        console.log('💡 Run: ./sync-user-to-template.sh admin@successtest.com');
      }
      return null;
    }

    if (data.data?.signIn?.tokens) {
      console.log('✅ Login successful!');
      
      const tokenPair = {
        accessOrWorkspaceAgnosticToken: data.data.signIn.tokens.accessOrWorkspaceAgnosticToken,
        refreshToken: data.data.signIn.tokens.refreshToken,
      };
      
      // Set in cookie (Twenty CRM uses cookies)
      document.cookie = `tokenPair=${encodeURIComponent(JSON.stringify(tokenPair))}; path=/; sameSite=lax; max-age=2592000`;
      
      console.log('✅ Token set in cookie');
      console.log('🔄 Reloading page...');
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
      return tokenPair;
    }

    throw new Error('Unexpected response format');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Make it available globally
window.loginSimple = loginSimple;

console.log('✅ Simple login function loaded!');
console.log('📖 Usage: loginSimple("admin@successtest.com", "password123")');


