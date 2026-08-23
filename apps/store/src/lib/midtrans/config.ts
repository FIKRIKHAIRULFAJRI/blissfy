import "server-only";

const sandboxBaseUrl = "https://api.sandbox.midtrans.com";
const productionBaseUrl = "https://api.midtrans.com";

export type MidtransConfig = {
  baseUrl: string;
  isProduction: boolean;
  serverKey: string;
};

export function isMidtransConfigured() {
  return Boolean(process.env.MIDTRANS_SERVER_KEY);
}

export function getMidtransConfig(): MidtransConfig {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    throw new MidtransConfigError(
      "MIDTRANS_NOT_CONFIGURED",
      "Konfigurasi Midtrans belum tersedia di server.",
    );
  }

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  return {
    baseUrl:
      process.env.MIDTRANS_BASE_URL ||
      (isProduction ? productionBaseUrl : sandboxBaseUrl),
    isProduction,
    serverKey,
  };
}

export function getInternalCronSecret() {
  return process.env.CRON_SECRET || process.env.MIDTRANS_WEBHOOK_SECRET || "";
}

export class MidtransConfigError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "MidtransConfigError";
    this.code = code;
  }
}
