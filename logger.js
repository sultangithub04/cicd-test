import pino from "pino";
import { trace } from "@opentelemetry/api";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "password",
      "req.headers.authorization",
      "accessToken",
      "refreshToken",
    ],
    censor: "[REDACTED]",
  },
  base: {
    service: "observability-demo",
  },
  mixin() {
    const span = trace.getActiveSpan();
    if (!span) return {};

    const context = span.spanContext();

    return {
      trace_id: context.traceId,
      span_id: context.spanId,
    };
  },
});

export default logger;