import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import passport from "./config/passport";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import contactRoutes from "./routes/contact";
import newsletterRoutes from "./routes/newsletter";
import path from "path";
import connectDB from './config/db';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://nexumed-frontend.vercel.app",
  "https://www.nexumed.eu",
  "https://nexumed.eu"
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

// Session setup
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

// Passport.js initialization
app.use(passport.initialize());
app.use(passport.session());

// Routes setup
app.use("/api/auth", authRoutes);
app.use("/api/stripe", webhookRoutes);
app.use("/api/stripe/payments", paymentRoutes);
app.use("/api/contact", contactRoutes); 
app.use("/api/newsletter", newsletterRoutes);

// EJS views setup
app.use("/images", express.static(path.join(__dirname, "images")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Health check route
app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// Server initialization
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed.");
    process.exit(0);
  });
});

// Uncaught exception handling
process.on("uncaughtException", (error) => {
  console.error("🔥 Uncaught Exception:", error);
});

// Unhandled rejection handling
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
});

