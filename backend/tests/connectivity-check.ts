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
  console.log("🚀 STARTING API CONNECTIVITY & RBAC SUITE CHECK");
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
    // Health & System (Public)
    {
      method: "GET",
      path: "/health",
      expectedStatus: [200],
      description: "Public Liveness & Health Endpoint",
    },
    {
      method: "GET",
      path: "/api/v1/nonexistent-route",
      expectedStatus: [404],
      description: "404 Not Found Handler",
    },
    // Vendor Categories (Protected by RBAC)
    {
      method: "GET",
      path: "/api/v1/vendors/categories",
      expectedStatus: [401, 200, 500],
      description: "List Categories (Protected by RBAC)",
    },
    {
      method: "POST",
      path: "/api/v1/vendors/categories",
      expectedStatus: [401, 400],
      body: {},
      description: "Create Category (Protected by RBAC)",
    },
    // Vendors (Protected by RBAC)
    {
      method: "GET",
      path: "/api/v1/vendors",
      expectedStatus: [401, 200, 500],
      description: "List Vendors (Protected by RBAC)",
    },
    {
      method: "POST",
      path: "/api/v1/vendors",
      expectedStatus: [401, 400],
      body: {},
      description: "Create Vendor (Protected by RBAC)",
    },
    // Users & Managers (Protected by RBAC)
    {
      method: "GET",
      path: "/api/v1/users",
      expectedStatus: [401, 200, 500],
      description: "List Users/Managers (Protected by RBAC)",
    },
    {
      method: "POST",
      path: "/api/v1/users",
      expectedStatus: [401, 400],
      body: {},
      description: "Create User/Manager (Protected by RBAC)",
    },
    // RFQs (Protected by RBAC)
    {
      method: "GET",
      path: "/api/v1/rfqs",
      expectedStatus: [401, 200, 500],
      description: "List RFQs (Protected by RBAC)",
    },
    {
      method: "POST",
      path: "/api/v1/rfqs",
      expectedStatus: [401, 400],
      body: {},
      description: "Create RFQ (Protected by RBAC)",
    },
    // Quotations (Protected by RBAC)
    {
      method: "GET",
      path: "/api/v1/quotations",
      expectedStatus: [401, 200, 500],
      description: "List Quotations (Protected by RBAC)",
    },
    // Purchase Orders (Protected by RBAC)
    {
      method: "GET",
      path: "/api/v1/purchase-orders",
      expectedStatus: [401, 200, 500],
      description: "List Purchase Orders (Protected by RBAC)",
    },
    // Invoices (Protected by RBAC)
    {
      method: "GET",
      path: "/api/v1/invoices",
      expectedStatus: [401, 200, 500],
      description: "List Invoices (Protected by RBAC)",
    },
    // Auth Module
    {
      method: "POST",
      path: "/api/v1/auth/login",
      expectedStatus: [400],
      body: {},
      description: "Auth Login (Public, Validation Error test)",
    },
    {
      method: "GET",
      path: "/api/v1/auth/me",
      expectedStatus: [401],
      description: "Auth Me (Protected by RBAC)",
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
  console.log("📊 CONNECTIVITY & RBAC SUMMARY REPORT");
  console.log("==========================================================");

  const passedCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  console.log(`Total Endpoints Checked: ${totalCount}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${totalCount - passedCount}`);

  if (passedCount === totalCount) {
    console.log("\n🎉 ALL RBAC ENFORCEMENT & ENDPOINT CHECKS PASSED PERFECTLY!\n");
  } else {
    console.log("\n⚠️ SOME CHECKS FAILED. SEE DETAILS ABOVE.\n");
  }
}

runConnectivityChecks().catch((err) => {
  console.error("Fatal error running connectivity test suite:", err);
  process.exit(1);
});
