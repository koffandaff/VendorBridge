import nodemailer from "nodemailer";

async function testEmail() {
  console.log("🚀 Testing Nodemailer with Gmail App Password...");

  const user = "hackathonadhd@gmail.com";
  const pass = "rlkg fglu vowg uiuz"; // App Password

  const transporterTLS = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // TLS
    auth: { user, pass },
  });

  console.log("Checking SMTP Connection (Port 587 TLS)...");
  try {
    await transporterTLS.verify();
    console.log("✅ Connection Verified!");

    const info = await transporterTLS.sendMail({
      from: `"VendorBridge System" <${user}>`,
      to: user,
      subject: "🎉 VendorBridge - Nodemailer Test Email Successful!",
      text: "Congratulations! Your Nodemailer setup with Gmail App Password is live and working perfectly.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; background-color: #f4f6f9; border-radius: 8px;">
          <h2 style="color: #2563eb;">VendorBridge Email System Active</h2>
          <p>This is a test notification confirming that <strong>Nodemailer</strong> is successfully configured with your Gmail App Password.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 0.9em; color: #64748b;">Sender: ${user}</p>
        </div>
      `,
    });

    console.log("✅ Email sent successfully! MessageID:", info.messageId);
  } catch (errTLS) {
    console.error("❌ Nodemailer failed:", errTLS instanceof Error ? errTLS.message : errTLS);
  }
}

testEmail().catch((err) => {
  console.error("Fatal Nodemailer Error:", err);
  process.exit(1);
});
