import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import PaymentModel from '../models/Payment';  

dotenv.config();

const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in the environment variables');
}

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia' as any,
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    // Construct the event with Stripe signature verification
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    console.log(`✅ Event received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Store successful payment in the database
        try {
          await PaymentModel.create({
            stripeId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
          });

          console.log('💾 Payment stored in DB:', paymentIntent.id);
        } catch (error) {
          console.error('❌ Error storing payment in DB:', error);
        }
        break;
      }
      case 'payment_intent.created':
        console.log('🆕 Payment intent created:', event.data.object);
        break;
      case 'charge.succeeded':
        console.log('✔️ Charge successful:', event.data.object);
        break;
      case 'charge.updated':
        console.log('🔄 Charge updated:', event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err);
    res.status(400).send('Webhook signature verification failed.');
  }
});

export default router;


