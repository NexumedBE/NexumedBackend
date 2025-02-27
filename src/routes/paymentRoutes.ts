import express, { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
// import { generateInvoice } from "../services/invoiceService";

dotenv.config();

const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in the environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia",
});

// Route to create a payment intent
router.post(
  "/create-payment-intent",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { amount, currency, email } = req.body;

      if (!amount || !currency || !email) {
        res.status(400).json({ error: "Amount, currency, and email are required" });
        return;
      }

      console.log("🟢 Creating payment intent with:", { amount, currency });

      const paymentIntent = await stripe.paymentIntents.create({
        amount,  
        currency,
      });

      console.log("✅ Payment intent created:", paymentIntent.id);

      res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      next(error);  
    }
  }
);

interface PaymentSuccessBody {
  deviceCount: string;
  price: string;
  packageName: string;
  email: string;
  paymentDetails: {
    id: string;
    amount: number;
    currency: string;
  };
}

// Route to generate invoice after successful payment
router.post(
  "/payment-success",
  async (req: Request<{}, {}, PaymentSuccessBody>, res: Response): Promise<void> => {
    const {  deviceCount, price, packageName, email, paymentDetails } = req.body;
    // const {  email, paymentDetails } = req.body;

    if (!email || !paymentDetails) {
      res.status(400).json({ error: "Email and payment details are required" });
      return;
    }

    try {
      console.log(`ℹ️ Generating invoice for ${email}...`);
      // await generateInvoice( deviceCount, price, packageName, email, paymentDetails);
      // await generateInvoice( deviceCount, price, packageName, email, paymentDetails);
      console.log(`✅ Invoice generated and sent to ${email}`);
      res.status(200).json({ message: "Invoice generated and sent successfully!" });
    } catch (error) {
      console.error("❌ Error generating invoice:", error);
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  }
);


// Global error handler for payments route
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("⚠️ Error in payments route:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

export default router;
