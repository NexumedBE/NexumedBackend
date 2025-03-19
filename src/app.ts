import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import passport from "./config/passport";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import contactRoutes from "./routes/contact";
import path from "path";

dotenv.config();

const app = express();

app.use(express.json()); // ✅ Ensures JSON parsing before routes
app.use(express.urlencoded({ extended: false }));

const allowedOrigins = [
  "http://localhost:3000",
  "https://nexumed-frontend.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Session Setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secure_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/stripe", webhookRoutes);
app.use("/api/stripe/payments", paymentRoutes);
app.use("/api/contact", contactRoutes); 

// EJS setup for invoice rendering
app.use("/images", express.static(path.join(__dirname, "images")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Base route for health check
app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// ✅ Start Server with Error Handling
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// 🛑 Handle SIGTERM for Railway Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed.");
    process.exit(0);
  });
});

// 🔥 Handle Uncaught Errors to Prevent Crashes
process.on("uncaughtException", (error) => {
  console.error("🔥 Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
});

export default app;


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

