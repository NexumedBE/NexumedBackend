import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Configure Nodemailer transporter for Microsoft 365
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com", // Microsoft 365 SMTP server
  port: 587, // Required for Office365
  secure: false, // Must be false for STARTTLS
  auth: {
    user: "joel.scharlach@nexumed.eu", // Your full Microsoft 365 email (e.g., joel.scharlach@nexumed.eu)
    pass: "JoelNexumed1", // Use App Password if MFA is enabled
  },
  tls: {
    ciphers: "TLSv1.2",
    rejectUnauthorized: false, // Prevents certificate issues
  },
});

/**
 * Generates a random temporary password.
 */
const generateTempPassword = (): string => {
  return Math.random().toString(36).slice(-8); // 8-character random password
};

/**
 * Sends an email with a temporary password.
 * @param recipientEmail The recipient's email address.
 * @param doctorName The doctor's name.
 * @param drsId The doctor's ID number.
 * @returns {Promise<{ tempPassword: string; hashedPassword: string }>} 
 */

const DOWNLOAD = "https://netorgft12042682.sharepoint.com/:u:/s/Nexumed/ESRm942RYnNLqWkbqnQ_NzUBtIZFMH7uuVJtN-4oFEAGuA?e=yTQHqD";
const PDF_LINK = "https://nexumed-frontend.vercel.app/thirdPartyConfig";

export const sendEmailWithTempPassword = async (
  recipientEmail: string,
  doctorName: string,
  drsId: string
) => {
  const tempPassword = generateTempPassword(); // Generate a temp password
  const hashedPassword = await bcrypt.hash(tempPassword, 10); // Hash it before saving

  const mailOptions = {
    from: `"Nexumed" <joel.scharlach@nexumed.eu>`, // Sender's email from Microsoft 365
    to: recipientEmail,
    subject: "Your Nexumed Account - Temporary Password",
    text: `Hello Dr. ${doctorName},
    You have been added to Nexcore by Nexumed.
    Your Doctor ID is: ${drsId}
    Temporary Password: ${tempPassword}
    Please log in and change your password after first login.
    Please sign in with your email and temp password here: www.nexumed.eu
    Best,
    Nexumed Team`,
    html: `<p>Hello Dr. <strong>${doctorName}</strong>,</p>
          <p>You have been added to <strong>Nexcore</strong> by <strong>Nexumed</strong>.</p>
          <p><strong>Doctor ID:</strong> ${drsId}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p>For security reasons, please change your password after logging in.</p>
          <p><strong>Sign in with your email and temp password here:</strong> 
          <a href="https://www.nexumed.eu" target="_blank">www.nexumed.eu</a></p>
          <br/>
          <p>For your version of the software application, you can use the same username and your newly 
           create password that you will use to login into the website</p>
          <p><strong>Download the Nexumed Application:</strong>  
          <a href="${DOWNLOAD}" target="_blank">Click here to download</a></p>
          <p>You will also find this link,  <a href="${PDF_LINK}" target="_blank">Configuration</a> to our website that will assist your EMR and device configuration.</p>
          <p>Best,<br/><strong>Nexumed Team</strong></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${recipientEmail}`);
    return { tempPassword, hashedPassword }; // Return both temp and hashed password
  } catch (error: any) {
    console.error("❌ Email sending failed:", error.message || error);
    throw new Error("Failed to send email.");
  }
};

// ✅ Verify SMTP Connection on Startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Verification Failed:", error);
  } else {
    console.log("✅ SMTP Connection Successful!");
  }
});



