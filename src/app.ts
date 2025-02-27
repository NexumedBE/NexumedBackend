import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from './config/passport';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import webhookRoutes from './routes/webhookRoutes';
import paymentRoutes from './routes/paymentRoutes';
import path from 'path';

dotenv.config();

const app = express();

app.use('/api/stripe', webhookRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const allowedOrigins = [
  "http://localhost:3000",
  "https://nexumed-frontend.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));



// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:3000", 
//     credentials: true,  
//   })
// );

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_secure_secret_key',
    resave: false,  
    saveUninitialized: false,  
    cookie: {
      httpOnly: true,  
      secure: process.env.NODE_ENV === "production",  // this is to make sure that in production only https is used
      sameSite: "lax", 
    },
  })
);

// Logging session info for debugging
app.use((req, res, next) => {
  console.log('Session data:', req.session);
  console.log('Session ID:', req.sessionID);
  next();
});

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Auth routes
app.use('/api/auth', authRoutes);

// Payment routes
app.use('/api/stripe/payments', paymentRoutes);

// EJS setup for invoice rendering
app.use('/images', express.static(path.join(__dirname, 'images')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Invoice route
// app.get('/invoice', (req, res) => {
//   const deviceCount = 3
//   const price = 35
//   const packageName = "Single"
//   const email = "jscharlach@hotmail.com"
//   const testPaymentDetails = {
//     id: '123456',
//     amount: 3500,
//     currency: 'EUR',
//   };
//   const formattedDate = new Date().toISOString().split('T')[0];
//   res.render('invoice-template', { deviceCount:deviceCount, price:price, packageName:packageName, userEmail:email, paymentDetails: testPaymentDetails, formattedDate });
// });

// Base route for health check
app.get('/', (req, res) => {
  res.send('Backend is running');
});

export default app;
