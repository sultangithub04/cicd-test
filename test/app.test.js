import test from "node:test";
import assert from "node:assert/strict";

test("health endpoint status", async () => {
  const response = await fetch(
    "http://localhost:3000/health"
  );

  assert.equal(response.status, 200);

  const body = await response.json();

  assert.equal(body.status, "ok");
});