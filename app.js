import express from "express";
import logger from "./logger.js";
import client from "prom-client";
import { processPayment } from "./tracing.js";



const app = express();

app.use(express.json());

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
});
const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : "unmatched";

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);

    const duration =
      Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestDuration.observe(labels, duration);
  });

  next();
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  logger.info(
    { method: req.method, path: req.path },
    "Request received"
  );

  res.json({ message: "API is running" });
});

app.get("/error", (req, res, next) => {
  next(new Error("Simulated database failure"));
});

app.post("/orders", async (req, res, next) => {
  try {
    const result = await processPayment("order-123");

    res.json({
      message: "Order processed",
      payment: result,
    });
  } catch (error) {
    next(error);
  }
});


app.use((err, req, res, next) => {
  logger.error(
    {
      err,
      method: req.method,
      path: req.path,
    },
    "Request failed"
  );

  res.status(500).json({
    error: "Internal server error",
  });
});

const server = app.listen(3000, () => {
  logger.info({ port: 3000 }, "Server started");
});

function shutdown() {
  server.close(async () => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);