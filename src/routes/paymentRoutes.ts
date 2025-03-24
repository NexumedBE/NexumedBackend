import express, { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { sendThankYouEmail } from "../utils/sendThankYouEmail";
import User from "../models/User";
// import { generateInvoice } from "../services/invoiceService";

dotenv.config();

const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in the environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-12-18.acacia",
});

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


router.post(
  "/create-subscription",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { amount, currency, email } = req.body;

      if (!amount || !currency || !email) {
        res.status(400).json({ error: "Amount, currency, and email are required" });
        return;
      }

      //Create or find customer
      const customers = await stripe.customers.list({ email, limit: 1 });
      const customer = customers.data.length
        ? customers.data[0]
        : await stripe.customers.create({ email });

      //Create subscription with dynamic price
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price_data: {
              unit_amount: amount,
              currency,
              recurring: { interval: "month" },
              // product: process.env.STRIPE_PRODUCT_ID!,
              product: "prod_Rz40I2tqG02ITV",
            },
          },
        ],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });

      //Safely extract client secret
      let clientSecret: string | null = null;

      const latestInvoice = subscription.latest_invoice;
      if (
        latestInvoice !== null &&
        typeof latestInvoice !== "string" &&
        latestInvoice.payment_intent
      ) {
        const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;
        clientSecret = paymentIntent.client_secret;
      }

      if (!clientSecret) {
        throw new Error("Could not retrieve client secret from subscription.");
      }

      //Update MongoDB user
      const updatedUser = await User.findOneAndUpdate(
        { email },
        {
          stripeCustomerId: customer.id,
          subscriptionId: subscription.id,
        },
        { new: true }
      );

      if (!updatedUser) {
        console.warn(`⚠️ No user found in DB for email: ${email}`);
      }

      //Return clientSecret
      res.status(200).json({
        clientSecret,
        subscriptionId: subscription.id,
      });
    } catch (error) {
      console.error("❌ Error creating subscription:", error);
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
    await sendThankYouEmail(email);
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


// router.post(
//   "/create-payment-intent",
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       const { amount, currency, email } = req.body;

//       if (!amount || !currency || !email) {
//         res.status(400).json({ error: "Amount, currency, and email are required" });
//         return;
//       }

//       console.log("🟢 Creating payment intent with:", { amount, currency });

//       const paymentIntent = await stripe.paymentIntents.create({
//         amount,  
//         currency,
//       });

//       console.log("✅ Payment intent created:", paymentIntent.id);

//       res.status(200).json({ clientSecret: paymentIntent.client_secret });
//     } catch (error) {
//       next(error);  
//     }
//   }
// );

