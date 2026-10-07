require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB, getDb, closeDB, mongoose } = require("./config/db");

const app = express();
const port = process.env.PORT || 5002;

// Allowed CORS origins
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((o) => o.trim())
  : [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://serialmanagement.vercel.app",
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback allow in dev
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Submission schema & model
const submissionSchema = new mongoose.Schema(
  {
    name: String,
    homeChurch: String,
    department: String,
    phoneNumber: String,
  },
  { collection: "form" }
);

const Submission =
  mongoose.models.Submission || mongoose.model("Submission", submissionSchema);

// API Health Check Endpoint
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "ok",
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Root welcome route
app.get("/", (req, res) => {
  res.send("Retail API Server is running.");
});

// Submissions route
app.get("/get-submissions", async (req, res) => {
  try {
    const submissions = await Submission.find();
    res.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// App Routes
app.use("/login", require("./routes/login"));
app.use("/users", require("./routes/users"));
app.use("/delete", require("./routes/delete"));
app.use("/deactivate", require("./routes/deactivate"));
app.use("/usershow", require("./routes/usershow"));
app.use("/content", require("./routes/content"));
app.use("/fetchusers", require("./routes/fetchusers"));
app.use("/newCars", require("./routes/newCars"));
app.use("/cars", require("./routes/cars"));
app.use("/serial", require("./routes/serial"));
app.use("/generateSerials", require("./routes/generateSerials"));
app.use("/assignSerial", require("./routes/singleSerial"));
app.use("/form", require("./routes/form"));
app.use("/invoices", require("./routes/invoices"));

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// Start Server and Connect Database
let server;

async function startServer() {
  try {
    await connectDB();

    // Bind MongoDB native Db instance to app.locals for existing routes
    app.locals.db = getDb();

    // Ensure database performance indexes
    const { ensureAllIndexes } = require("./config/indexes");
    await ensureAllIndexes(app.locals.db);

    server = app.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server listening at http://localhost:${port}`);
      console.log(`📡 Healthcheck available at http://localhost:${port}/api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log("HTTP server closed.");
      await closeDB();
      process.exit(0);
    });
  } else {
    await closeDB();
    process.exit(0);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();

module.exports = app;
