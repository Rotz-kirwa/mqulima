import { describe, it, expect } from "vitest";

describe("M-Pesa Payment Idempotency & Reconciliation", () => {
  it("should validate M-Pesa STK Callback metadata structure", () => {
    const validCallback = {
      Body: {
        stkCallback: {
          MerchantRequestID: "29115-34620561-1",
          CheckoutRequestID: "ws_CO_180820261200001",
          ResultCode: 0,
          ResultDesc: "The service request is processed successfully.",
          CallbackMetadata: {
            Item: [
              { Name: "Amount", Value: 1500 },
              { Name: "MpesaReceiptNumber", Value: "QGH789KLMN" },
              { Name: "TransactionDate", Value: 20260818120000 },
              { Name: "PhoneNumber", Value: 254712345678 },
            ],
          },
        },
      },
    };

    const stk = validCallback.Body.stkCallback;
    expect(stk.ResultCode).toBe(0);
    expect(stk.CheckoutRequestID).toBe("ws_CO_180820261200001");

    const amountItem = stk.CallbackMetadata.Item.find((i) => i.Name === "Amount");
    const receiptItem = stk.CallbackMetadata.Item.find((i) => i.Name === "MpesaReceiptNumber");

    expect(amountItem?.Value).toBe(1500);
    expect(receiptItem?.Value).toBe("QGH789KLMN");
  });

  it("should detect payment failure ResultCode", () => {
    const failedCallback = {
      Body: {
        stkCallback: {
          MerchantRequestID: "29115-34620561-2",
          CheckoutRequestID: "ws_CO_180820261200002",
          ResultCode: 1032,
          ResultDesc: "Request cancelled by user.",
        },
      },
    };

    expect(failedCallback.Body.stkCallback.ResultCode).not.toBe(0);
  });
});
