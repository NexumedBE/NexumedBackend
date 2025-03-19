import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const IMAGE_PATH = path.join(__dirname, "..", "src", "images", "nexumed.png");

// Configure Nodemailer transporter for Microsoft 365
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com", // Microsoft 365 SMTP server
  port: 587, // Required for Office365
  secure: false, // Must be false for STARTTLS
  auth: {
    user: process.env.EMAIL_USER, // Your full Microsoft 365 email Just using my joel.scharlach@nexumed.eu
    pass: "JoelNexumed1", // Use App Password if MFA is enabled
  },
  tls: {
    ciphers: "TLSv1.2",
    rejectUnauthorized: false, // Prevents certificate issues
  },
});

/**
 * This will generate a random 8 digit password.
 */
const generateTempPassword = (): string => {
  return Math.random().toString(36).slice(-8); 
};

/**
 * Sends an email with a temporary password.
 * @param recipientEmail 
 * @param doctorName 
 * @param drsId 
 * @returns {Promise<{ tempPassword: string; hashedPassword: string }>} 
 */

const DOWNLOAD = "https://netorgft12042682.sharepoint.com/:u:/s/Nexumed/ESRm942RYnNLqWkbqnQ_NzUBtIZFMH7uuVJtN-4oFEAGuA?e=yTQHqD";

export const sendEmailWithTempPassword = async (
  recipientEmail: string,
  doctorName: string,
  drsId: string
) => {
  const tempPassword = generateTempPassword(); 
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const mailOptions = {
    from: `"Nexumed" <${process.env.EMAIL_USER}>`, // Sender's email from Microsoft 365. Just using my joel.scharlach@nexumed.eu for now.  
                                                  // Can be changed, but needs to be chanaged in the .env and the host for the BE
                                                  // at current production time can be found at https://railway.com
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
          <p><img src="cid:nexumedlogo" alt="Nexumed Logo" width="200"/></p> <!-- Logo added here -->
          <p><strong>Doctor ID:</strong> ${drsId}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p>For security reasons, please change your password after logging in.</p>
          <p><strong>Sign in with your email and temp password here:</strong> 
          <a href="https://www.nexumed.eu" target="_blank">www.nexumed.eu</a></p>
          <br/>
          <p>For your version of the software application, you can use the same username and your newly 
           created password that you will use to log in to the website.</p>
          <p><strong>Download the Nexumed Application:</strong>  
          <a href="${DOWNLOAD}" target="_blank">Click here to download</a></p>
          <p>Best,<br/><strong>Nexumed Team</strong></p>`,
      attachments: [
        {
          filename: "nexumed.png",
          path: IMAGE_PATH, 
          cid: "nexumedlogo",
        },
      ],
    };
  

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${recipientEmail}`);
    return { tempPassword, hashedPassword }; 
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



