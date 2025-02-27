import * as fs from 'fs';
import * as path from 'path';
import ejs from 'ejs';
import puppeteer from 'puppeteer';
// import nodemailer from 'nodemailer';

interface PaymentDetails {
    id: string;
    amount: number; 
    currency: string;
}

// const sendInvoiceByEmail = async (email: string, filePath: string): Promise<void> => {
//     const transporter = nodemailer.createTransport({
//       host: "smtp.office365.com", 
//       port: 587, 
//       secure: false,
//       auth: {
//         user: process.env.EMAIL_USER, 
//         pass: process.env.EMAIL_PASS,
//       },
//     });
  
//     try {
//       await transporter.sendMail({
//         from: '"Nexumed" <joel.scharlach@nexumed.eu>',
//         to: email, 
//         subject: "Your Payment Invoice from Nexumed", 
//         html: `<p>Please find your attached PDF invoice.</p>`, 
//         attachments: [
//           {
//             filename: `invoice_${path.basename(filePath)}`,
//             path: filePath, 
//           },
//         ],
//       });
  
//       console.log(`📧 Invoice sent successfully to: ${email}`);
//     } catch (error) {
//       console.error("❌ Error sending invoice email:", error);
//       throw new Error("Failed to send invoice email.");
//     }
//   };

export const generateInvoice = async (deviceCount: string, price: string, packageName: string, userEmail: string, paymentDetails: PaymentDetails): Promise<void> => {
    const invoicesDir = "./invoices";

        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir);
        }

        const filePath = path.join(invoicesDir, `invoice_${paymentDetails.id}.pdf`);

        try {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("Missing email credentials in environment variables");
            }
            const templatePath = path.resolve(__dirname, '..', 'views', 'invoice-template.ejs');
            const template = await fs.promises.readFile(templatePath, 'utf8');

            const formattedDate = new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            
            const html = ejs.render(template, { deviceCount, price, packageName, userEmail, paymentDetails, formattedDate });

            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            await page.pdf({ path: filePath, format: 'A4' });
            await browser.close();

            console.log(`📄 Invoice saved at: ${filePath}`);

            // await sendInvoiceByEmail(userEmail, filePath);

            fs.unlink(filePath, (err) => {
            if (err) console.error(`Failed to delete invoice file: ${filePath}`, err);
            });
        } catch (error) {
        if (error instanceof Error) {
            console.error('❌ Error generating or sending invoice:', error.message);
            throw new Error(`Failed to generate invoice: ${error.message}`);
        } else {
            console.error('❌ Unknown error occurred:', error);
            throw new Error('An unknown error occurred during invoice generation.');
        }
    }
}