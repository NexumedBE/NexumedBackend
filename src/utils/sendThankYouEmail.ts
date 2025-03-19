import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const DOWNLOAD_LINK = "https://netorgft12042682.sharepoint.com/:u:/s/Nexumed/ESRm942RYnNLqWkbqnQ_NzUBtIZFMH7uuVJtN-4oFEAGuA?e=yTQHqD";

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: "JoelNexumed1" // Use environment variable
  },
  tls: {
    ciphers: "TLSv1.2",
    rejectUnauthorized: false,
  },
});

/**
 * Sends a thank-you email with the Nexumed download link.
 * @param recipientEmail - The recipient's email address.
 */
export const sendThankYouEmail = async (recipientEmail: string): Promise<void> => {
  const mailOptions = {
    from: `"Nexumed" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: "Thank You for Your Nexcore Subscription",
    text: `Hello,

            Thank you for subscribing to Nexumed! We're excited to have you onboard.

            To get started, you can download the Nexumed application using the link below:
            Download Nexumed: ${DOWNLOAD_LINK}

            If you have any questions, feel free to reach out to our support team.

            Best,
            The Nexumed Team`,
    html: `<p>Hello,</p>
          <p>Thank you for subscribing to <strong>Nexcore</strong> by <strong>Nexumed</strong>.</p>
          <p><strong>Download the latest version of Nexcore at :</strong> <a href="${DOWNLOAD_LINK}" target="_blank">Click here to download</a></p>
          <p>You will also find instructions in configuring Nexcore with various EMRs and devices.</p>
          <p>This can be found on the our website.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <br/>
          <p>Best,</p>
          <p><strong>The Nexumed Team</strong></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Thank-you email sent to ${recipientEmail}`);
  } catch (error: any) {
    console.error("❌ Failed to send thank-you email:", error.message || error);
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
