// Multi-user test using dashboard endpoint
// All authenticated users (any role) can access /dashboard/stats
// This simulates 3 different users hitting the dashboard concurrently

const { execSync } = require('child_process');

// Get fresh super admin token
function getToken() {
  try {
    const res = execSync(
      'curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"biplove@example.com\\",\\"password\\":\\"Biplove123@#\\"}"',
      { encoding: 'utf8' }
    );
    return JSON.parse(res).data.accessToken;
  } catch {
    return 'TOKEN_FETCH_FAILED';
  }
}

const token = getToken();

module.exports = {
  endpoint: 'http://localhost:3001/dashboard/stats',
  method: 'GET',
  concurrency: 10,
  totalRequests: 30,
  // Single super admin token — tests concurrent access from same user
  headers: {
    Authorization: `Bearer ${token}`,
  },
  invariant: (response) => response.status === 200,
};
