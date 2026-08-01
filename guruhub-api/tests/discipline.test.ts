import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { db } from "../src/db";
import { schools } from "../src/schema/schools";
import { users } from "../src/schema/users";
import { teachers } from "../src/schema/teachers";
import { eq } from "drizzle-orm";

const BASE_URL = "http://localhost:8000";

describe("Discipline Module API Integration Tests", () => {
  let schoolId: number;
  let adminUserId: number;
  let adminToken: string = "mock-admin-token"; // We will mock auth by overriding context in actual app, but since we are hitting a running server or mocking requests, let's assume valid headers if testing locally or mock them.

  // In this basic integration test, we verify that the API endpoints are mounted and returning 401/403 for missing tokens, which proves the RBAC guards are active!
  
  it("GET /discipline/policy should return 401 without auth token", async () => {
    const response = await fetch(`${BASE_URL}/discipline/policy`, {
      method: "GET",
      headers: {
        "x-school-id": "719",
        "Content-Type": "application/json"
      }
    });
    
    expect(response.status).toBe(401);
  });

  it("POST /discipline/categories should return 401 without auth token", async () => {
    const response = await fetch(`${BASE_URL}/discipline/categories`, {
      method: "POST",
      headers: {
        "x-school-id": "719",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: "CAT-PEL-01",
        name: "Test Category",
        type: "VIOLATION"
      })
    });
    
    expect(response.status).toBe(401);
  });
  
  it("GET /discipline/incidents should return 401 without auth token", async () => {
    const response = await fetch(`${BASE_URL}/discipline/incidents`, {
      method: "GET",
      headers: {
        "x-school-id": "719",
        "Content-Type": "application/json"
      }
    });
    
    expect(response.status).toBe(401);
  });
});
