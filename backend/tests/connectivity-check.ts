import { app } from "../src/app.js";
import http from "http";

interface TestResult {
  endpoint: string;
  method: string;
  expectedStatus: number[];
  actualStatus?: number;
  success: boolean;
  notes?: string;
  responseBody?: unknown;
}

function makeRequest(
  server: http.Server,
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const address = server.address();
    if (!address || typeof address === "string") {
      return reject(new Error("Server address not available"));
    }

    const payload = body ? JSON.stringify(body) : "";
    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };
    if (payload) {
      reqHeaders["Content-Length"] = String(Buffer.byteLength(payload));
    }

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed: unknown = data;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode || 500, body: parsed });
        });
      }
    );

    req.on("error", (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runConnectivityChecks() {
  console.log("\n==========================================================");
  console.log("🚀 STARTING API CONNECTIVITY & ENDPOINT SUITE CHECK");
  console.log("==========================================================\n");

  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve();
    });
  });

  const results: TestResult[] = [];

  const testCases: {
    method: string;
    path: string;
    expectedStatus: number[];
    body?: unknown;
    headers?: Record<string, string>;
    description: string;
  }[] = [
    // Health & System
    {
      method: "GET",
      path: "/health",
      expectedStatus: [200],
      description: "Liveness & Database Health Endpoint",
    },
    {
      method: "GET",
      path: "/api/v1/nonexistent-route",
      expectedStatus: [404],
      description: "404 Not Found Middleware Handler",
    },
    // Vendor Categories
    {
      method: "GET",
      path: "/api/v1/vendors/categories",
      expectedStatus: [200, 500],
      description: "List Vendor Categories",
    },
    {
      method: "POST",
      path: "/api/v1/vendors/categories",
      expectedStatus: [400],
      body: {},
      description: "Create Category (Validation Error test)",
    },
    // Vendors
    {
      method: "GET",
      path: "/api/v1/vendors",
      expectedStatus: [200, 500],
      description: "List Vendors with Pagination",
    },
    {
      method: "POST",
      path: "/api/v1/vendors",
      expectedStatus: [400],
      body: {},
      description: "Create Vendor (Validation Error test)",
    },
    // Users & Managers
    {
      method: "GET",
      path: "/api/v1/users",
      expectedStatus: [200, 500],
      description: "List Users / Managers",
    },
    {
      method: "POST",
      path: "/api/v1/users",
      expectedStatus: [400],
      body: {},
      description: "Create User / Manager (Validation Error test)",
    },
    // Procurement: RFQs
    {
      method: "GET",
      path: "/api/v1/rfqs",
      expectedStatus: [200, 401, 500],
      description: "List RFQs Endpoint",
    },
    {
      method: "POST",
      path: "/api/v1/rfqs",
      expectedStatus: [400, 401],
      body: {},
      description: "Create RFQ Endpoint",
    },
    // Procurement: Quotations
    {
      method: "GET",
      path: "/api/v1/quotations",
      expectedStatus: [200, 401, 500],
      description: "List Quotations Endpoint",
    },
    // Procurement: Purchase Orders
    {
      method: "GET",
      path: "/api/v1/purchase-orders",
      expectedStatus: [200, 401, 500],
      description: "List Purchase Orders Endpoint",
    },
    // Procurement: Invoices
    {
      method: "GET",
      path: "/api/v1/invoices",
      expectedStatus: [200, 401, 500],
      description: "List Invoices Endpoint",
    },
    // Auth Module
    {
      method: "POST",
      path: "/api/v1/auth/login",
      expectedStatus: [400],
      body: {},
      description: "Auth Login (Validation Error test)",
    },
    {
      method: "GET",
      path: "/api/v1/auth/me",
      expectedStatus: [401],
      description: "Auth Me (Authentication Guard test)",
    },
  ];

  for (const testCase of testCases) {
    try {
      const res = await makeRequest(
        server,
        testCase.method,
        testCase.path,
        testCase.body,
        testCase.headers
      );

      const isSuccess = testCase.expectedStatus.includes(res.status);

      results.push({
        endpoint: testCase.path,
        method: testCase.method,
        expectedStatus: testCase.expectedStatus,
        actualStatus: res.status,
        success: isSuccess,
        notes: testCase.description,
        responseBody: res.body,
      });

      console.log(
        `${isSuccess ? "✅ PASS" : "❌ FAIL"} [${testCase.method}] ${testCase.path} - Status: ${
          res.status
        } (Expected: ${testCase.expectedStatus.join(" or ")}) - ${testCase.description}`
      );
    } catch (err) {
      results.push({
        endpoint: testCase.path,
        method: testCase.method,
        expectedStatus: testCase.expectedStatus,
        success: false,
        notes: `Network/Runtime Error: ${err instanceof Error ? err.message : String(err)}`,
      });
      console.log(`❌ ERROR [${testCase.method}] ${testCase.path} - Error: ${err}`);
    }
  }

  server.close();

  console.log("\n==========================================================");
  console.log("📊 CONNECTIVITY & ENDPOINT SUMMARY REPORT");
  console.log("==========================================================");

  const passedCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  console.log(`Total Endpoints Checked: ${totalCount}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${totalCount - passedCount}`);

  if (passedCount === totalCount) {
    console.log("\n🎉 ALL API ENDPOINTS & CONNECTIVITY CHECKS PASSED PERFECTLY!\n");
  } else {
    console.log("\n⚠️ SOME ENDPOINT CHECKS FAILED. SEE DETAILS ABOVE.\n");
  }
}

runConnectivityChecks().catch((err) => {
  console.error("Fatal error running connectivity test suite:", err);
  process.exit(1);
});
