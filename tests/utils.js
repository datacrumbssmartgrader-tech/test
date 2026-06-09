/**
 * Testing utilities for Riwayat v2 backend
 * Provides helpers for HTTP requests, assertions, and test organization
 */

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

/**
 * Simple assertion helper
 */
function expect(actual, expected, message = "") {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

/**
 * Check if value is in range (for status codes, etc.)
 */
function expectIn(actual, ...expected) {
  if (!expected.includes(actual)) {
    throw new Error(`Expected one of [${expected.join(", ")}], got ${actual}`);
  }
}

/**
 * Make HTTP request
 */
async function request(method, path, { body = null, headers = {}, cookies = null } = {}) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  // Add cookies to headers if provided
  if (cookies && Object.keys(cookies).length > 0) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
    options.headers["Cookie"] = cookieString;
  }

  if (body) {
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type");
    let data = null;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else if (contentType && contentType.includes("image/")) {
      data = await response.arrayBuffer();
    } else if (contentType && contentType.includes("text/event-stream")) {
      // For SSE streams, just read the first event and close
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const chunk = await reader.read();
      data = decoder.decode(chunk.value);
      reader.cancel(); // Cancel the stream
    } else {
      data = await response.text();
    }

    // Extract Set-Cookie header for session management
    const setCookie = response.headers.get("set-cookie");
    let cookies = {};
    if (setCookie) {
      const match = setCookie.match(/rw_session=([^;]+)/);
      if (match) {
        cookies.rw_session = match[1];
      }
    }

    return {
      status: response.status,
      data,
      cookies,
      headers: response.headers,
      ok: response.ok,
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

/**
 * Login helper - returns session with token
 */
async function login(pin = "1234") {
  const response = await request("POST", "/api/auth/login", {
    body: { pin },
  });

  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.status}`);
  }

  return {
    user: response.data.user,
    cookies: response.cookies,
    token: response.cookies.rw_session,
  };
}

/**
 * Test suite organizer
 */
class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log(`\n${colors.blue}${this.name}${colors.reset}`);
    console.log("=".repeat(50));

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`${colors.green}✓${colors.reset} ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} ${test.name}`);
        console.log(`${colors.red}  Error: ${error.message}${colors.reset}`);
        this.failed++;
      }
    }

    console.log("=".repeat(50));
    const total = this.passed + this.failed;
    const status =
      this.failed === 0
        ? `${colors.green}${this.passed}/${total} passed${colors.reset}`
        : `${colors.red}${this.failed} failed${colors.reset}, ${this.passed}/${total} passed`;
    console.log(`Summary: ${status}\n`);

    return this.failed === 0;
  }
}

/**
 * Wait for server to be ready
 */
async function waitForServer(maxAttempts = 30, delay = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/me`);
      if (response) {
        console.log(`${colors.green}✓ Server ready${colors.reset}`);
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error("Server did not respond in time");
}

module.exports = { expect, expectIn, request, login, TestSuite, waitForServer };
