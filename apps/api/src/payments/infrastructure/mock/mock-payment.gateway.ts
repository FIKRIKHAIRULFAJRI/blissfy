import { Injectable } from '@nestjs/common';

import type {
  CreateQrisPaymentInput,
  PaymentGateway,
  PaymentStatusResult,
  QrisPaymentResult,
} from '../../domain/payment-gateway';

@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  createQrisPayment(input: CreateQrisPaymentInput): Promise<QrisPaymentResult> {
    const providerOrderId = input.orderNumber;

    const providerTransactionId = `mock-${input.orderNumber}`;

    return Promise.resolve({
      provider: 'mock',

      providerOrderId,

      providerTransactionId,

      status: 'PENDING',

      amount: input.amount,

      qrImageUrl: createMockQrisImage(input.orderNumber),

      qrString: `MOCK-QRIS:${input.orderNumber}:${input.amount}`,

      expiresAt: input.expiresAt.toISOString(),

      rawResponse: {
        environment: 'development',
        simulated: true,
      },
    });
  }

  getPaymentStatus(providerOrderId: string): Promise<PaymentStatusResult> {
    return Promise.resolve({
      provider: 'mock',

      providerOrderId,

      providerTransactionId: `mock-${providerOrderId}`,

      status: 'PENDING',

      paidAt: null,

      rawResponse: {
        environment: 'development',
        simulated: true,
      },
    });
  }
}

function createMockQrisImage(orderNumber: string) {
  const safeOrderNumber = escapeXml(orderNumber);

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="320"
      height="320"
      viewBox="0 0 320 320"
    >
      <rect
        width="320"
        height="320"
        fill="white"
      />

      <rect
        x="35"
        y="35"
        width="70"
        height="70"
        fill="black"
      />

      <rect
        x="215"
        y="35"
        width="70"
        height="70"
        fill="black"
      />

      <rect
        x="35"
        y="215"
        width="70"
        height="70"
        fill="black"
      />

      <rect
        x="130"
        y="40"
        width="25"
        height="25"
        fill="black"
      />

      <rect
        x="165"
        y="70"
        width="25"
        height="25"
        fill="black"
      />

      <rect
        x="125"
        y="125"
        width="30"
        height="30"
        fill="black"
      />

      <rect
        x="170"
        y="125"
        width="25"
        height="25"
        fill="black"
      />

      <rect
        x="205"
        y="145"
        width="30"
        height="30"
        fill="black"
      />

      <rect
        x="120"
        y="180"
        width="25"
        height="25"
        fill="black"
      />

      <rect
        x="160"
        y="190"
        width="35"
        height="35"
        fill="black"
      />

      <rect
        x="215"
        y="205"
        width="25"
        height="25"
        fill="black"
      />

      <rect
        x="250"
        y="240"
        width="30"
        height="30"
        fill="black"
      />

      <text
        x="160"
        y="305"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="10"
        fill="black"
      >
        MOCK QRIS - ${safeOrderNumber}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
