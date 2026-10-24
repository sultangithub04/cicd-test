import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace";
import {
  getNodeAutoInstrumentations,
} from "@opentelemetry/auto-instrumentations-node";

const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  instrumentations: [
    getNodeAutoInstrumentations(),
  ],
});

sdk.start();

process.on("SIGTERM", async () => {
  await sdk.shutdown();
  process.exit(0);
});