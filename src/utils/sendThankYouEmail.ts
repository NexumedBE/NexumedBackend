import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const DOWNLOAD_LINK = "https://netorgft12042682.sharepoint.com/:u:/s/Nexumed/ESRm942RYnNLqWkbqnQ_NzUBtIZFMH7uuVJtN-4oFEAGuA?e=yTQHqD";
const PDF_LINK = "https://nexumed-frontend.vercel.app/thirdPartyConfig";


const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: "joel.scharlach@nexumed.eu",
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
    from: `"Nexumed" <joel.scharlach@nexumed.eu>`,
    to: recipientEmail,
    subject: "Thank You for Your Nexcore Subscription",
    text: `Hello,

            Thank you for subscribing to Nexumed! We're excited to have you onboard.

            To get started, you can download the Nexumed application using the link below:
            Download Nexumed: ${DOWNLOAD_LINK}

            You will also find this link, ${PDF_LINK} to our website that will assist your EMR and device configuration.

            If you have any questions, feel free to reach out to our support team.

            Best,
            The Nexumed Team`,
    html: `<p>Hello,</p>
          <p>Thank you for subscribing to <strong>Nexcore</strong> by <strong>Nexumed</strong>.</p>
          <p><strong>Download the latest version of Nexcore at :</strong> <a href="${DOWNLOAD_LINK}" target="_blank">Click here to download</a></p>
          <p>You will also find this link,  <a href="${PDF_LINK}" target="_blank">Configuration</a> to our website that will assist your EMR and device configuration.</p>
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
