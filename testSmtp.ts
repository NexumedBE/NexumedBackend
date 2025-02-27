import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: "smtp.office365.com", // Use Microsoft 365 SMTP
    port: 587, // Required for Office365
    secure: false, // Must be false for STARTTLS
    auth: {
      user: process.env.EMAIL_USER, // Your full email (e.g., joel.scharlach@nexumed.eu)
      pass: process.env.EMAIL_PASS, // Might need an App Password if MFA is enabled
    },
    tls: {
      ciphers: "TLSv1.2",
      rejectUnauthorized: false,
    },
  });

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Verification Failed:", error);
  } else {
    console.log("✅ SMTP Connection Successful!");
  }
});
