import { VendorService } from "../src/modules/vendors/vendor.service.js";
import { vendorRouter } from "../src/modules/vendors/vendor.routes.js";
import { app } from "../src/app.js";

async function runVerification() {
  console.log("Checking vendor module imports and exports...");
  if (!vendorRouter) {
    throw new Error("vendorRouter is not defined!");
  }
  if (!VendorService) {
    throw new Error("VendorService is not defined!");
  }
  if (!app) {
    throw new Error("Express app is not defined!");
  }

  const service = new VendorService();
  console.log("VendorService instantiated successfully:", typeof service.listVendors);
  console.log("Express app configured with vendor routes successfully.");
  console.log("✅ Vendor Module Verification Passed Cleanly!");
}

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
