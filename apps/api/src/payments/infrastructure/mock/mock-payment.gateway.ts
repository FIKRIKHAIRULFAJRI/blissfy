import { Injectable } from '@nestjs/common';

import {
  type CreateQrisPaymentInput,
  type GetPaymentStatusInput,
  type PaymentGateway,
  type PaymentStatusResult,
  type QrisPaymentResult,
} from '../../domain/payment-gateway';

@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  createQrisPayment(input: CreateQrisPaymentInput): Promise<QrisPaymentResult> {
    const providerTransactionId = `mock-${input.orderNumber}`;

    return Promise.resolve({
      provider: 'mock',

      providerOrderId: input.orderNumber,

      providerTransactionId,

      status: 'PENDING',

      amount: input.amount,

      qrImageUrl: createMockQrisImage(input.orderNumber, input.amount),

      qrString: `MOCK-QRIS:${input.orderNumber}:${input.amount}`,

      expiresAt: input.expiresAt.toISOString(),

      rawResponse: {
        environment: 'development',

        simulated: true,

        providerTransactionId,
      },
    });
  }

  getPaymentStatus(input: GetPaymentStatusInput): Promise<PaymentStatusResult> {
    return Promise.resolve({
      provider: 'mock',

      providerOrderId: input.providerOrderId,

      providerTransactionId: input.providerTransactionId,

      status: 'PENDING',

      paidAt: null,

      rawResponse: {
        environment: 'development',

        simulated: true,
      },
    });
  }
}

function createMockQrisImage(orderNumber: string, amount: number) {
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
        x="30"
        y="30"
        width="70"
        height="70"
        fill="black"
      />

      <rect
        x="220"
        y="30"
        width="70"
        height="70"
        fill="black"
      />

      <rect
        x="30"
        y="220"
        width="70"
        height="70"
        fill="black"
      />

      <rect
        x="125"
        y="40"
        width="20"
        height="20"
        fill="black"
      />

      <rect
        x="155"
        y="40"
        width="20"
        height="20"
        fill="black"
      />

      <rect
        x="125"
        y="75"
        width="20"
        height="20"
        fill="black"
      />

      <rect
        x="150"
        y="115"
        width="25"
        height="25"
        fill="black"
      />

      <rect
        x="115"
        y="150"
        width="25"
        height="25"
        fill="black"
      />

      <rect
        x="185"
        y="150"
        width="25"
        height="25"
        fill="black"
      />

      <rect
        x="150"
        y="185"
        width="25"
        height="25"
        fill="black"
      />

      <rect
        x="220"
        y="220"
        width="20"
        height="20"
        fill="black"
      />

      <rect
        x="255"
        y="220"
        width="20"
        height="20"
        fill="black"
      />

      <rect
        x="220"
        y="255"
        width="20"
        height="20"
        fill="black"
      />

      <rect
        x="255"
        y="255"
        width="20"
        height="20"
        fill="black"
      />

      <text
        x="160"
        y="305"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="9"
        fill="black"
      >
        MOCK ${escapeXml(orderNumber)} ${amount}
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
