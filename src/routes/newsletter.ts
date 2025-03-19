import express, { Request, Response } from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ✅ Configure Nodemailer for Office365
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.office365.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: "joel.scharlach@nexumed.eu", 
    pass: "JoelNexumed1",
  },
  tls: {
    ciphers: "TLSv1.2",
    rejectUnauthorized: false,
  },
});


transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP Verification Failed:", error);
  } else {
    console.log("📨 Newsletter SMTP Connected!");
  }
});


router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { name, email } = req.body;

  if (!name || !email) {
    res.status(400).json({ message: "Name and email are required." });
    return;
  }

  const mailOptions = {
    from: `"Nexumed Newsletter" <joel.scharlach@nexumed.eu>`,
    to: ["joel.scharlach@nexumed.eu", "carl.jans@nexumed.eu"], 
    subject: "New Newsletter Subscription",
    text: `Name: ${name}\nEmail: ${email}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ New Newsletter Subscription from ${email}`);
    res.status(200).json({ message: "Subscription successful!" });
    return;
  } catch (error: any) {
    console.error("❌ Newsletter email sending failed:", error.message || error);
    res.status(500).json({ message: "Failed to subscribe. Try again later." });
    return;
  }
});

export default router;
