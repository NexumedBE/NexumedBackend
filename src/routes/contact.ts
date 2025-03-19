import express, { Request, Response } from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Configure Nodemailer for Office365
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, // Required for STARTTLS
  auth: {
    user: "joel.scharlach@nexumed.eu", // Use .env for security once railway is sorted
    pass: "JoelNexumed1",
  },
  tls: {
    ciphers: "TLSv1.2",
    rejectUnauthorized: false,
  },
});

// Verify SMTP Connection on Startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Verification Failed:", error);
  } else {
    console.log("🏒 SMTP Connection Successful!");
  }
});

// Contact Form API Route
router.post("/", async (req: Request, res: Response): Promise<void>  => {
  const { name, email, telephone, profession, message } = req.body;

  if (!name || !email || !message) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  const mailOptions = {
    from: `"Contact Form" <joel.scharlach@nexumed.eu>`,
    to: ["joel.scharlach@nexumed.eu", "carl.jans@nexumed.eu"],
    subject: "New Contact Form Submission",
    text: `
      Name: ${name}
      Email: ${email}
      Telephone: ${telephone || "N/A"}
      Profession: ${profession || "N/A"}
      Message: ${message}
    `,
    html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Telephone:</strong> ${telephone || "N/A"}</p>
      <p><strong>Profession:</strong> ${profession || "N/A"}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Contact form email sent from ${email}`);
    res.status(200).json({ message: "Email sent successfully" });
    return;
  } catch (error: any) {
    console.error("❌ Email sending failed:", error.message || error);
    res.status(500).json({ message: "Failed to send email" });
    return;
  }
});

export default router;
