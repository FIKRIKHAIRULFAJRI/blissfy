import { z } from "zod";

export const midtransNotificationSchema = z
  .object({
    fraud_status: z.string().optional(),
    gross_amount: z.string().min(1),
    order_id: z.string().min(1),
    payment_type: z.string().optional(),
    settlement_time: z.string().optional(),
    signature_key: z.string().min(1),
    status_code: z.string().min(1),
    status_message: z.string().optional(),
    transaction_id: z.string().optional(),
    transaction_status: z.string().min(1),
  })
  .passthrough();

export type MidtransNotificationInput = z.infer<
  typeof midtransNotificationSchema
>;
