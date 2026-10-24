
import { trace, SpanStatusCode } from "@opentelemetry/api";

const tracer = trace.getTracer("order-service");

export async function processPayment(orderId) {
  return tracer.startActiveSpan(
    "processPayment",
    async (span) => {
      try {
        span.setAttribute("order.id", orderId);

        // Simulate payment processing
        await new Promise((resolve) =>
          setTimeout(resolve, 200)
        );

        span.setAttribute("payment.status", "success");

        return { success: true };
      } catch (error) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });

        throw error;
      } finally {
        span.end();
      }
    }
  );
}
