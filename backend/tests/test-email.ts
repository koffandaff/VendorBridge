import nodemailer from "nodemailer";

async function testEmail() {
  console.log("🚀 Testing Nodemailer with Gmail credentials...");

  const user = "hackathonadhd@gmail.com";
  const pass = "Krisha1011@";

  // Try Port 465 (SSL) and Port 587 (TLS/STARTTLS)
  const transporterSSL = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL
    auth: { user, pass },
  });

  const transporterTLS = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // TLS
    auth: { user, pass },
  });

  console.log("Checking SMTP Connection (Port 465 SSL)...");
  try {
    await transporterSSL.verify();
    console.log("✅ SSL Connection Verified (Port 465)!");

    const info = await transporterSSL.sendMail({
      from: `"VendorBridge Test" <${user}>`,
      to: user,
      subject: "VendorBridge - Nodemailer Test Email (SSL)",
      text: "Nodemailer integration test successfully sent!",
      html: "<b>Nodemailer integration test successfully sent!</b>",
    });

    console.log("✅ Email sent successfully via SSL (465)! MessageID:", info.messageId);
    return;
  } catch (errSSL) {
    console.log("⚠️ SSL (465) connection attempt result:", errSSL instanceof Error ? errSSL.message : errSSL);
  }

  console.log("\nChecking SMTP Connection (Port 587 TLS)...");
  try {
    await transporterTLS.verify();
    console.log("✅ TLS Connection Verified (Port 587)!");

    const info = await transporterTLS.sendMail({
      from: `"VendorBridge Test" <${user}>`,
      to: user,
      subject: "VendorBridge - Nodemailer Test Email (TLS)",
      text: "Nodemailer integration test successfully sent!",
      html: "<b>Nodemailer integration test successfully sent!</b>",
    });

    console.log("✅ Email sent successfully via TLS (587)! MessageID:", info.messageId);
  } catch (errTLS) {
    console.error("❌ TLS (587) connection failed:", errTLS instanceof Error ? errTLS.message : errTLS);
  }
}

testEmail().catch((err) => {
  console.error("Fatal Nodemailer Error:", err);
  process.exit(1);
});
