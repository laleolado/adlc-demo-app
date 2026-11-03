import { beforeEach, describe, expect, it } from "vitest";
import { call, resetToFixtures, setStatus } from "../helpers";

describe("issue 3: shipped orders cannot be cancelled", () => {
  beforeEach(resetToFixtures);

  it("rejects cancelling a shipped order with 409 and leaves order unchanged", async () => {
    const before = await call("GET", "/api/orders/ord_seed_shipped");

    // Attempting to cancel a shipped order should be rejected
    const { status, body } = await setStatus("ord_seed_shipped", "cancelled");

    expect(status).toBe(409);
    expect(body.error.code).toBe("INVALID_ORDER_TRANSITION");

    // Order and its history should remain unchanged
    const after = await call("GET", "/api/orders/ord_seed_shipped");
    expect(after.body.order.status).toBe(before.body.order.status);
    expect(after.body.order.history).toEqual(before.body.order.history);
  });
});
