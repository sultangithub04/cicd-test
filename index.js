
import express from "express";
import pino from "pino";
import client from "prom-client";


const app = express();


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



const logger = pino({
  level: "info",
});

logger.info("Application started");

logger.info(
  {
    method: "GET",
    path: "/health",
    statusCode: 200,
  },
  "Request completed"
);

logger.warn(
  { remainingBalance: 10 },
  "Low wallet balance"
);

logger.error(
  { errorCode: "PAYMENT_FAILED" },
  "Payment failed"
);
