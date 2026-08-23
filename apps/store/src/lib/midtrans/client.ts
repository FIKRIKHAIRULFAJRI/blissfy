import "server-only";

import { getMidtransConfig } from "@/lib/midtrans/config";

type MidtransAction = {
  name?: string;
  method?: string;
  url?: string;
};

export type MidtransChargeResponse = {
  status_code?: string;
  status_message?: string;
  transaction_id?: string;
  order_id?: string;
  merchant_id?: string;
  gross_amount?: string;
  currency?: string;
  payment_type?: string;
  transaction_time?: string;
  transaction_status?: string;
  fraud_status?: string;
  actions?: MidtransAction[];
  qr_string?: string;
  expiry_time?: string;
  [key: string]: unknown;
};

export type MidtransStatusResponse = MidtransChargeResponse & {
  settlement_time?: string;
};

type ChargeQrisInput = {
  orderId: string;
  grossAmount: number;
  expiryMinutes: number;
  customer?: {
    firstName?: string;
    email?: string;
    phone?: string;
  };
};

export async function chargeQris(input: ChargeQrisInput) {
  const body = {
    payment_type: "qris",
    transaction_details: {
      order_id: input.orderId,
      gross_amount: input.grossAmount,
    },
    custom_expiry: {
      expiry_duration: input.expiryMinutes,
      unit: "minute",
    },
    customer_details: input.customer
      ? {
          first_name: input.customer.firstName,
          email: input.customer.email,
          phone: input.customer.phone,
        }
      : undefined,
  };

  return midtransRequest<MidtransChargeResponse>("/v2/charge", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getTransactionStatus(orderId: string) {
  return midtransRequest<MidtransStatusResponse>(
    `/v2/${encodeURIComponent(orderId)}/status`,
    {
      method: "GET",
    },
  );
}

export function getQrisImageUrl(response: MidtransChargeResponse) {
  return response.actions?.find((action) =>
    action.name?.toLowerCase().includes("qr"),
  )?.url;
}

export function sanitizeMidtransPayload<T extends Record<string, unknown>>(
  payload: T,
) {
  const safePayload = { ...payload };

  delete safePayload.signature_key;

  return safePayload;
}

async function midtransRequest<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const config = getMidtransConfig();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${config.serverKey}:`).toString(
        "base64",
      )}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const text = await response.text();
  const json = parseJson(text);

  if (!response.ok) {
    throw new MidtransApiError(
      "MIDTRANS_API_ERROR",
      "Midtrans belum dapat memproses pembayaran.",
      response.status,
      json,
    );
  }

  return json as T;
}

function parseJson(text: string) {
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export class MidtransApiError extends Error {
  code: string;
  status: number;
  response: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status: number,
    response: Record<string, unknown>,
  ) {
    super(message);
    this.name = "MidtransApiError";
    this.code = code;
    this.status = status;
    this.response = response;
  }
}
