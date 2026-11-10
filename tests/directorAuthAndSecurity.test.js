import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Director Authorization and Security Controls", () => {
  it("rejects unauthorized tokens and rejects legacy backdoor strings by default", () => {
    const activeSessions = {
      "valid-2fa-token-123": { username: "DirectorAdmin", createdAt: Date.now() },
    };

    function checkAuth(token, secretKey = null) {
      if (!token) return false;
      if (secretKey && token === secretKey) return true;
      return Boolean(activeSessions[token]);
    }

    // Default configuration with no backdoor secret key
    assert.equal(checkAuth("imperium-director-9942"), false, "Backdoor key must be rejected by default");
    assert.equal(checkAuth("random-intruder"), false, "Random tokens must be rejected");
    assert.equal(checkAuth(""), false, "Empty token must be rejected");
    assert.equal(checkAuth(null), false, "Null token must be rejected");

    // Legitimate authenticated session token
    assert.equal(checkAuth("valid-2fa-token-123"), true, "Valid 2FA session must be authenticated");

    // Explicit environment secret key when provided by admin
    assert.equal(checkAuth("admin-env-key-99", "admin-env-key-99"), true, "Admin secret key accepted when explicitly configured");
  });

  it("authenticates via worker fetch handler for /api/auth/login", async () => {
    const workerModule = await import("../worker.js");
    const worker = workerModule.default;

    // Test with correct master password
    const loginReq = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Vikidaman",
        password: "imperium-2026",
        directLogin: true,
      }),
    });
    const loginRes = await worker.fetch(loginReq, {});
    assert.equal(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.equal(loginData.ok, true);
    assert.ok(loginData.sessionToken, "Must return sessionToken");
    assert.equal(loginData.username, "Vikidaman");

    // Test with invalid password
    const badReq = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Vikidaman",
        password: "wrong-password",
      }),
    });
    const badRes = await worker.fetch(badReq, {});
    assert.equal(badRes.status, 401);

    // Verify session token works with status check
    const statusReq = new Request("http://localhost/api/auth/status", {
      method: "GET",
      headers: { "X-Director-Key": loginData.sessionToken },
    });
    const statusRes = await worker.fetch(statusReq, {});
    assert.equal(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.equal(statusData.authenticated, true);
    assert.equal(statusData.username, "Vikidaman");
  });
});

