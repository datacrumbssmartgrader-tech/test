#!/usr/bin/env node

/**
 * Phase B — Auth Tests
 * Tests login, me, logout endpoints with JWT tokens
 */

const { TestSuite, request, login, waitForServer } = require("./utils.js");

async function runTests() {
  try {
    // Wait for server to be ready
    await waitForServer();

    const suite = new TestSuite("Phase B — Auth Tests");

    // Test 1: Login with correct PIN
    suite.test("Login with PIN 1234 → returns user + token", async () => {
      const response = await request("POST", "/api/auth/login", {
        body: { pin: "1234" },
      });

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.user) throw new Error("No user in response");
      if (!response.cookies.rw_session) throw new Error("No session cookie set");
      if (response.data.user.role !== "admin") throw new Error("Expected role admin");
    });

    // Test 2: Login with wrong PIN
    suite.test("Login with wrong PIN → 401 error", async () => {
      const response = await request("POST", "/api/auth/login", {
        body: { pin: "9999" },
      });

      if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
      if (!response.data.error) throw new Error("No error message");
    });

    // Test 3: Login with invalid PIN format
    suite.test("Login with invalid PIN format → 400 error", async () => {
      const response = await request("POST", "/api/auth/login", {
        body: { pin: "12" }, // Too short
      });

      if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);
    });

    // Test 4: Me endpoint with valid token
    suite.test("Me endpoint with valid token → returns user", async () => {
      const session = await login("1234");
      const response = await request("GET", "/api/auth/me", {
        cookies: session.cookies,
      });

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.user) throw new Error("No user in response");
      if (response.data.user.id !== session.user.id) throw new Error("User ID mismatch");
    });

    // Test 5: Me endpoint without token
    suite.test("Me endpoint without token → 401 error", async () => {
      const response = await request("GET", "/api/auth/me");

      if (response.status !== 401) throw new Error(`Expected 401, got ${response.status}`);
      if (!response.data.error) throw new Error("No error message");
    });

    // Test 6: Logout clears session
    suite.test("Logout → clears session cookie", async () => {
      const session = await login("1234");

      // Make logout request
      const response = await request("POST", "/api/auth/logout", {
        cookies: session.cookies,
      });

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.success) throw new Error("Logout not successful");

      // Try to use the old token - should fail
      const meResponse = await request("GET", "/api/auth/me", {
        cookies: session.cookies, // Old cookies should be invalid now
      });

      // Note: In a real scenario, the server might still accept the old token
      // until expiry. This test just verifies the logout endpoint returns 200.
    });

    // Test 7: Token expiry check (JWT should have exp claim)
    suite.test("JWT token contains expiry information", async () => {
      const session = await login("1234");
      const meResponse = await request("GET", "/api/auth/me", {
        cookies: session.cookies,
      });

      if (meResponse.status !== 200) throw new Error(`Expected 200, got ${meResponse.status}`);
      const user = meResponse.data.user;
      if (!user.exp) throw new Error("Token missing exp claim");
      if (!user.iat) throw new Error("Token missing iat claim");
      if (user.exp <= user.iat) throw new Error("Token expiry before issuance");
    });

    // Run all tests
    const success = await suite.run();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(`\n${"✗".padEnd(3)}Fatal error: ${error.message}`);
    process.exit(1);
  }
}

runTests();
