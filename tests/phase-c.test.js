#!/usr/bin/env node

/**
 * Phase C — Menu + Cloudinary Tests
 * Tests menu CRUD endpoints and image upload
 */

const { TestSuite, request, login, waitForServer } = require("./utils.js");

async function runTests() {
  try {
    // Wait for server to be ready
    await waitForServer();

    const suite = new TestSuite("Phase C — Menu + Cloudinary Tests");

    // Get authenticated session
    let session;
    let createdItemId;

    // Setup: Login before running tests
    suite.test("Setup: Login to get admin session", async () => {
      session = await login("1234");
      if (!session.user) throw new Error("Login failed");
      if (!session.token) throw new Error("No token in session");
    });

    // Test 1: List admin menu (should have existing items)
    suite.test("List admin menu → returns seeded items", async () => {
      const response = await request("GET", "/api/admin/menu", {
        cookies: session.cookies,
      });

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.success) throw new Error("Response not successful");
      if (!Array.isArray(response.data.items)) throw new Error("Items not array");
      if (response.data.items.length === 0) throw new Error("No seeded items found");
    });

    // Test 2: Get public menu (excludes hidden items)
    suite.test("Get public menu → returns available items only", async () => {
      const response = await request("GET", "/api/menu", {});

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.success) throw new Error("Response not successful");
      if (!Array.isArray(response.data.items)) throw new Error("Items not array");
      if (response.data.items.length === 0) throw new Error("No items in public menu");
      
      // Verify items have expected public properties (no hidden/available fields)
      const item = response.data.items[0];
      if (!item.id || !item.name || !item.category || !item.price) {
        throw new Error("Item missing required properties");
      }
    });

    // Test 3: Create menu item with existing image
    suite.test("Create menu item → saves to database", async () => {
      const response = await request("POST", "/api/admin/menu", {
        body: {
          name: "Test Kebab",
          category: "grills",
          price: 1500,
          description: "Special test kebab",
          image_url: "https://res.cloudinary.com/dtindnle9/image/upload/v1/sample.jpg",
          image_public_id: "test/kebab-123",
        },
        cookies: session.cookies,
      });

      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      if (!response.data.success) throw new Error("Response not successful");
      if (!response.data.item.id) throw new Error("No item ID returned");
      
      createdItemId = response.data.item.id;
    });

    // Test 4: Update menu item (PUT)
    suite.test("Update menu item → changes persisted", async () => {
      if (!createdItemId) throw new Error("No item created in previous test");

      const response = await request("PUT", `/api/admin/menu/${createdItemId}`, {
        body: {
          name: "Updated Kebab",
          category: "grills",
          price: 1800,
          description: "Updated description",
          image_url: "https://res.cloudinary.com/dtindnle9/image/upload/v1/sample-2.jpg",
          image_public_id: "test/kebab-updated",
        },
        cookies: session.cookies,
      });

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (parseFloat(response.data.item.price) !== 1800) throw new Error(`Price not updated, got ${response.data.item.price}`);
      if (response.data.item.name !== "Updated Kebab") throw new Error("Name not updated");
    });

    // Test 5: Toggle availability (PATCH)
    suite.test("Toggle item availability → status changes", async () => {
      if (!createdItemId) throw new Error("No item to toggle");

      const response = await request("PATCH", `/api/admin/menu/${createdItemId}`, {
        body: {
          field: "available",
          value: false,
        },
        cookies: session.cookies,
      });

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (response.data.item.available !== false) throw new Error("Availability not toggled");
    });

    // Test 6: Delete menu item (DELETE)
    suite.test("Delete menu item → removed from database", async () => {
      if (!createdItemId) throw new Error("No item to delete");

      const response = await request("DELETE", `/api/admin/menu/${createdItemId}`, {
        cookies: session.cookies,
      });

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.success) throw new Error("Delete not successful");
    });

    // Test 7: Verify item deleted (should not appear in menu)
    suite.test("Verify deleted item → no longer in database", async () => {
      if (!createdItemId) throw new Error("No item to verify");

      const response = await request("GET", "/api/admin/menu", {
        cookies: session.cookies,
      });

      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      
      const found = response.data.items.find((item) => item.id === createdItemId);
      if (found) throw new Error("Deleted item still found in menu");
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
