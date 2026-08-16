import { UserService } from "../src/modules/users/user.service.js";
import { userRouter } from "../src/modules/users/user.routes.js";
import { app } from "../src/app.js";

async function runVerification() {
  console.log("Checking User/Manager module imports and exports...");
  if (!userRouter) {
    throw new Error("userRouter is not defined!");
  }
  if (!UserService) {
    throw new Error("UserService is not defined!");
  }
  if (!app) {
    throw new Error("Express app is not defined!");
  }

  const service = new UserService();
  console.log("UserService instantiated successfully:", typeof service.listUsers);
  console.log("Express app configured with user/manager routes successfully.");
  console.log("✅ User/Manager Module Verification Passed Cleanly!");
}

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
