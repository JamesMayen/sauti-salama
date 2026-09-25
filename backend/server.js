import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";

import { connectDB } from "./src/config/db.js";

import authRoutes from "./src/routes/authRoutes.js";
import verificationRoutes from "./src/routes/verificationRoutes.js";
import reportRoutes from "./src/routes/reportRoutes.js";
import alertRoutes from "./src/routes/alertRoutes.js";
import civicRoutes from "./src/routes/civicRoutes.js";
import sourceRoutes from "./src/routes/sourceRoutes.js";
import smsRoutes from "./src/routes/smsRoutes.js";

import AppError from "./src/utils/AppError.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

import {
  apiLimiter,
  preventParameterPollution,
} from "./src/middleware/security.js";

import { validateEnvironment } from "./src/config/env.js";

/*
|--------------------------------------------------------------------------
| Load Environment Variables
|--------------------------------------------------------------------------
*/

dotenv.config();

/*
|--------------------------------------------------------------------------
| Validate Environment
|--------------------------------------------------------------------------
*/

validateEnvironment();

/*
|--------------------------------------------------------------------------
| Initialize Express
|--------------------------------------------------------------------------
*/

const app = express();

app.set("trust proxy", 1);

/*
|--------------------------------------------------------------------------
| Environment Configuration
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 5000;

const CLIENT_URL =
  process.env.CLIENT_URL ||
  "http://localhost:5173";

/*
|--------------------------------------------------------------------------
| Database Connection
|--------------------------------------------------------------------------
*/

await connectDB();

/*
|--------------------------------------------------------------------------
| Security Headers
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(morgan(":method :url :status :response-time ms"));

/*
|--------------------------------------------------------------------------
| General API Rate Limiting
|--------------------------------------------------------------------------
|
| Protects the API from excessive automated requests.
|
*/

app.use("/api", apiLimiter);

/*
|--------------------------------------------------------------------------
| Request Body Parsing
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "100kb",
  })
);

/*
|--------------------------------------------------------------------------
| HTTP Parameter Pollution Protection
|--------------------------------------------------------------------------
*/

app.use(preventParameterPollution);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Sauti Salama API is running",
    environment:
      process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| API Information
|--------------------------------------------------------------------------
*/

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    name: "Sauti Salama API",
    version: "1.0.0",
    message:
      "Trusted information. Safer communities.",
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Sauti Salama API is running",
    status: "healthy",
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

app.use(
  "/api/verification",
  verificationRoutes
);

app.use("/api/reports", reportRoutes);

app.use("/api/alerts", alertRoutes);

app.use("/api/civic", civicRoutes);

app.use("/api/sources", sourceRoutes);

app.use("/api/sms", smsRoutes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res, next) => {
  next(
    new AppError(
      `Route not found: ${req.method} ${req.originalUrl}`,
      404,
      "ROUTE_NOT_FOUND"
    )
  );
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
  console.log(
    `Sauti Salama API running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`
  );
});