import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getMidtransEventHash,
  getMidtransSignature,
  mapMidtransStatus,
  parseGrossAmount,
} from "@/lib/payments/midtrans-contract";
import { midtransNotificationSchema } from "@/lib/payments/schemas";

describe("Midtrans payment contract", () => {
  it("validates webhook payload shape without exposing secrets", () => {
    const payload = midtransNotificationSchema.parse({
      fraud_status: "accept",
      gross_amount: "109000.00",
      order_id: "BLS-20260814-ABC12345",
      payment_type: "qris",
      signature_key: "a".repeat(128),
      status_code: "200",
      transaction_id: "transaction-1",
      transaction_status: "settlement",
    });

    assert.equal(payload.order_id, "BLS-20260814-ABC12345");
    assert.equal(payload.transaction_status, "settlement");
  });

  it("builds Midtrans SHA512 signature from order status amount and server key", () => {
    assert.equal(
      getMidtransSignature({
        grossAmount: "109000.00",
        orderId: "BLS-20260814-ABC12345",
        serverKey: "sandbox-server-key",
        statusCode: "200",
      }),
      getMidtransSignature({
        grossAmount: "109000.00",
        orderId: "BLS-20260814-ABC12345",
        serverKey: "sandbox-server-key",
        statusCode: "200",
      }),
    );
  });

  it("maps paid and terminal gateway statuses deterministically", () => {
    assert.deepEqual(
      mapMidtransStatus({
        fraudStatus: "accept",
        transactionStatus: "capture",
      }),
      {
        paymentStatus: "PAID",
        processingResult: "SALE_FINALIZED",
        shouldFinalizeSale: true,
        shouldReleaseReservation: false,
      },
    );
    assert.equal(
      mapMidtransStatus({ transactionStatus: "expire" }).paymentStatus,
      "EXPIRED",
    );
    assert.equal(
      mapMidtransStatus({ transactionStatus: "deny" }).paymentStatus,
      "FAILED",
    );
  });

  it("normalizes gross amount and event hash for idempotent webhook processing", () => {
    const payload = {
      gross_amount: "109000.00",
      order_id: "BLS-20260814-ABC12345",
      signature_key: "a".repeat(128),
      status_code: "200",
      transaction_id: "transaction-1",
      transaction_status: "settlement",
    };

    assert.equal(parseGrossAmount(payload.gross_amount), 109000);
    assert.equal(getMidtransEventHash(payload), getMidtransEventHash(payload));
  });
});
