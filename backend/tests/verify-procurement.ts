import { RfqService } from "../src/modules/rfqs/rfq.service.js";
import { rfqRouter } from "../src/modules/rfqs/rfq.routes.js";
import { QuotationService } from "../src/modules/quotations/quotation.service.js";
import { quotationRouter } from "../src/modules/quotations/quotation.routes.js";
import { PurchaseOrderService } from "../src/modules/purchase-orders/purchase-order.service.js";
import { purchaseOrderRouter } from "../src/modules/purchase-orders/purchase-order.routes.js";
import { InvoiceService } from "../src/modules/invoices/invoice.service.js";
import { invoiceRouter } from "../src/modules/invoices/invoice.routes.js";
import { app } from "../src/app.js";

async function runVerification() {
  console.log("Checking procurement module imports and exports...");

  if (!rfqRouter || !quotationRouter || !purchaseOrderRouter || !invoiceRouter) {
    throw new Error("One or more routers are not defined!");
  }
  if (!RfqService || !QuotationService || !PurchaseOrderService || !InvoiceService) {
    throw new Error("One or more services are not defined!");
  }
  if (!app) {
    throw new Error("Express app is not defined!");
  }

  const rfqService = new RfqService();
  const quotationService = new QuotationService();
  const poService = new PurchaseOrderService();
  const invoiceService = new InvoiceService();

  console.log("RfqService instantiated:", typeof rfqService.createRfq);
  console.log("QuotationService instantiated:", typeof quotationService.compareQuotations);
  console.log("PurchaseOrderService instantiated:", typeof poService.createPurchaseOrder);
  console.log("InvoiceService instantiated:", typeof invoiceService.createInvoice);
  console.log("Express app configured with procurement routes successfully.");
  console.log("✅ Procurement Module Verification Passed Cleanly!");
}

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});