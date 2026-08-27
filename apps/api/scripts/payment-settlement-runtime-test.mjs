import {
  createHash,
  createHmac,
  randomUUID,
} from 'node:crypto';

import {
  readFileSync,
} from 'node:fs';

import {
  dirname,
  resolve,
} from 'node:path';

import {
  fileURLToPath,
} from 'node:url';

import pg from 'pg';

const {
  Pool,
} = pg;

const currentDirectory =
  dirname(
    fileURLToPath(
      import.meta.url,
    ),
  );

const envPath =
  resolve(
    currentDirectory,
    '../.env',
  );

const envText =
  readFileSync(
    envPath,
    'utf8',
  );

function getEnvValue(
  key,
) {
  for (
    const rawLine
    of envText.split(
      /\r?\n/,
    )
  ) {
    const line =
      rawLine.trim();

    if (
      !line ||
      line.startsWith('#')
    ) {
      continue;
    }

    const separatorIndex =
      line.indexOf('=');

    if (
      separatorIndex === -1
    ) {
      continue;
    }

    const currentKey =
      line
        .slice(
          0,
          separatorIndex,
        )
        .trim();

    if (
      currentKey !== key
    ) {
      continue;
    }

    let value =
      line
        .slice(
          separatorIndex + 1,
        )
        .trim();

    if (
      (
        value.startsWith('"') &&
        value.endsWith('"')
      ) ||
      (
        value.startsWith("'") &&
        value.endsWith("'")
      )
    ) {
      value =
        value.slice(
          1,
          -1,
        );
    }

    if (!value) {
      throw new Error(
        `${key} kosong di apps/api/.env`,
      );
    }

    return value;
  }

  throw new Error(
    `${key} tidak ditemukan di apps/api/.env`,
  );
}

function sha256(
  value,
) {
  return createHash(
    'sha256',
  )
    .update(
      value,
    )
    .digest(
      'hex',
    );
}

const databaseUrl =
  getEnvValue(
    'DATABASE_URL',
  );

const clientId =
  getEnvValue(
    'DOKU_CLIENT_ID',
  );

const clientSecret =
  getEnvValue(
    'DOKU_SECRET_KEY',
  );

const pool =
  new Pool({
    connectionString:
      databaseUrl,
  });

const endpointPath =
  '/v1.0/qr/qr-mpm-notify';

const endpointUrl =
  `http://localhost:3002${endpointPath}`;

const accessToken =
  'runtime-paid-settlement-token';

const uniqueSuffix =
  `${Date.now()}-${randomUUID()
    .replaceAll('-', '')
    .slice(0, 8)}`;

const orderNumber =
  `BLS-RUNTIME-${uniqueSuffix}`;

const gatewayReference =
  `DOKU-RUNTIME-${uniqueSuffix}`;

const fixture = {
  orderId:
    null,

  paymentId:
    null,

  reservationId:
    null,

  variantId:
    null,

  quantity:
    1,

  stockBefore:
    null,

  amount:
    null,
};

function createSignature({
  body,
  timestamp,
}) {
  const requestBody =
    JSON.stringify(
      body,
    );

  const bodyHash =
    createHash(
      'sha256',
    )
      .update(
        requestBody,
      )
      .digest(
        'hex',
      )
      .toLowerCase();

  const stringToSign = [
    'POST',

    endpointPath,

    accessToken,

    bodyHash,

    timestamp,
  ].join(
    ':',
  );

  return createHmac(
    'sha512',
    clientSecret,
  )
    .update(
      stringToSign,
    )
    .digest(
      'base64',
    );
}

async function createFixture() {
  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN',
    );

    const variantResult =
      await client.query(`
        SELECT
          id::text
            AS "variantId",

          stock

        FROM product_variants

        WHERE stock >= 2

        ORDER BY
          stock DESC,
          id

        LIMIT 1

        FOR UPDATE
      `);

    const variant =
      variantResult.rows[0];

    if (!variant) {
      throw new Error(
        'Tidak ada variant dengan stock minimal 2.',
      );
    }

    fixture.variantId =
      variant.variantId;

    fixture.stockBefore =
      Number(
        variant.stock,
      );

    const sourceOrderResult =
      await client.query(`
        SELECT
          *

        FROM orders

        WHERE
          "shippingQuoteId"
            IS NOT NULL

          AND "totalPayment" > 0

        ORDER BY
          "createdAt" DESC

        LIMIT 1
      `);

    const source =
      sourceOrderResult.rows[0];

    if (!source) {
      throw new Error(
        'Tidak ada source order yang bisa digunakan untuk fixture.',
      );
    }

    fixture.amount =
      Number(
        source.totalPayment,
      );

    const orderResult =
      await client.query(
        `
          INSERT INTO orders (
            "orderNumber",

            "accessTokenHash",

            "idempotencyKeyHash",

            "idempotencyPayloadHash",

            "shippingQuoteId",

            "recipientName",

            whatsapp,

            email,

            "destinationProvinceId",

            "destinationProvinceName",

            "destinationCityId",

            "destinationCityName",

            "destinationDistrictId",

            "destinationDistrictName",

            "postalCode",

            address,

            "orderNote",

            "courierCode",

            "courierName",

            "serviceCode",

            "serviceName",

            "estimatedDelivery",

            "shippingCost",

            "grossSubtotal",

            "discountTotal",

            "netSubtotal",

            "totalWeightGram",

            "totalPayment",

            "paymentStatus",

            "fulfillmentStatus",

            "expiresAt"
          )

          SELECT
            $1,

            $2,

            $3,

            $4,

            source."shippingQuoteId",

            source."recipientName",

            source.whatsapp,

            source.email,

            source."destinationProvinceId",

            source."destinationProvinceName",

            source."destinationCityId",

            source."destinationCityName",

            source."destinationDistrictId",

            source."destinationDistrictName",

            source."postalCode",

            source.address,

            'Runtime payment settlement fixture',

            source."courierCode",

            source."courierName",

            source."serviceCode",

            source."serviceName",

            source."estimatedDelivery",

            source."shippingCost",

            source."grossSubtotal",

            source."discountTotal",

            source."netSubtotal",

            source."totalWeightGram",

            source."totalPayment",

            'PENDING'
              ::"PaymentStatus",

            'WAITING_PAYMENT'
              ::"FulfillmentStatus",

            NOW() +
              INTERVAL '30 minutes'

          FROM orders source

          WHERE
            source.id = $5

          RETURNING
            id::text
              AS "orderId",

            "orderNumber",

            "totalPayment"
        `,
        [
          orderNumber,

          sha256(
            `access-${uniqueSuffix}`,
          ),

          sha256(
            `idempotency-${uniqueSuffix}`,
          ),

          sha256(
            `payload-${uniqueSuffix}`,
          ),

          source.id,
        ],
      );

    const order =
      orderResult.rows[0];

    if (!order) {
      throw new Error(
        'Fixture order gagal dibuat.',
      );
    }

    fixture.orderId =
      order.orderId;

    const paymentResult =
      await client.query(
        `
          INSERT INTO payments (
            "orderId",

            amount,

            provider,

            "providerOrderId",

            "gatewayTransactionId",

            status,

            "expiresAt"
          )

          VALUES (
            $1,

            $2,

            'doku',

            $3,

            $4,

            'PENDING'
              ::"PaymentStatus",

            NOW() +
              INTERVAL '30 minutes'
          )

          RETURNING
            id::text
              AS "paymentId"
        `,
        [
          fixture.orderId,

          fixture.amount,

          orderNumber,

          gatewayReference,
        ],
      );

    fixture.paymentId =
      paymentResult
        .rows[0]
        ?.paymentId;

    if (
      !fixture.paymentId
    ) {
      throw new Error(
        'Fixture payment gagal dibuat.',
      );
    }

    const reservationResult =
      await client.query(
        `
          INSERT INTO stock_reservations (
            "orderId",

            "variantId",

            quantity,

            status,

            "expiresAt"
          )

          VALUES (
            $1,

            $2,

            $3,

            'ACTIVE'
              ::"StockReservationStatus",

            NOW() +
              INTERVAL '30 minutes'
          )

          RETURNING
            id::text
              AS "reservationId"
        `,
        [
          fixture.orderId,

          fixture.variantId,

          fixture.quantity,
        ],
      );

    fixture.reservationId =
      reservationResult
        .rows[0]
        ?.reservationId;

    if (
      !fixture.reservationId
    ) {
      throw new Error(
        'Fixture reservation gagal dibuat.',
      );
    }

    await client.query(
      `
        INSERT INTO inventory_movements (
          "variantId",

          "orderId",

          "reservationId",

          type,

          "quantityDelta",

          note
        )

        VALUES (
          $1,

          $2,

          $3,

          'RESERVATION_CREATED',

          $4,

          'Runtime payment settlement fixture'
        )
      `,
      [
        fixture.variantId,

        fixture.orderId,

        fixture.reservationId,

        -fixture.quantity,
      ],
    );

    await client.query(
      'COMMIT',
    );
  } catch (error) {
    await client.query(
      'ROLLBACK',
    );

    throw error;
  } finally {
    client.release();
  }
}

async function sendPaidWebhook() {
  const timestamp =
    new Date()
      .toISOString()
      .replace(
        /\.\d{3}Z$/,
        'Z',
      );

  const body = {
    originalReferenceNo:
      gatewayReference,

    originalPartnerReferenceNo:
      orderNumber,

    latestTransactionStatus:
      '00',

    transactionStatusDesc:
      'Success',

    amount: {
      value:
        `${fixture.amount}.00`,

      currency:
        'IDR',
    },

    paidTime:
      timestamp,

    transactionDate:
      timestamp,

    additionalInfo: {
      source:
        'runtime-paid-settlement-test',
    },
  };

  const signature =
    createSignature({
      body,
      timestamp,
    });

  const response =
    await fetch(
      endpointUrl,
      {
        method:
          'POST',

        headers: {
          Accept:
            'application/json',

          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${accessToken}`,

          'X-TIMESTAMP':
            timestamp,

          'X-PARTNER-ID':
            clientId,

          'X-EXTERNAL-ID':
            String(
              Date.now(),
            ),

          'X-SIGNATURE':
            signature,
        },

        body:
          JSON.stringify(
            body,
          ),
      },
    );

  let responseBody;

  try {
    responseBody =
      await response.json();
  } catch {
    responseBody =
      null;
  }

  return {
    status:
      response.status,

    body:
      responseBody,
  };
}

async function inspectSettlement() {
  const result =
    await pool.query(
      `
        SELECT
          o."paymentStatus"::text
            AS "orderPaymentStatus",

          o."fulfillmentStatus"::text
            AS "fulfillmentStatus",

          p.status::text
            AS "paymentStatus",

          p."paidAt",

          sr.status::text
            AS "reservationStatus",

          pv.stock
            AS "stockAfter",

          (
            SELECT
              COUNT(*)::int

            FROM inventory_movements movement

            WHERE
              movement."orderId" = o.id

              AND movement.type =
                'SALE_CONFIRMED'
          )
            AS "saleConfirmedCount"

        FROM orders o

        INNER JOIN payments p
          ON p."orderId" =
            o.id

        INNER JOIN stock_reservations sr
          ON sr."orderId" =
            o.id

        INNER JOIN product_variants pv
          ON pv.id =
            sr."variantId"

        WHERE
          o.id = $1
      `,
      [
        fixture.orderId,
      ],
    );

  return (
    result.rows[0] ??
    null
  );
}

function verifySettlement(
  state,
) {
  if (!state) {
    throw new Error(
      'Settlement state tidak ditemukan.',
    );
  }

  const expectedStock =
    fixture.stockBefore -
    fixture.quantity;

  if (
    state.orderPaymentStatus !==
    'PAID'
  ) {
    throw new Error(
      `Order seharusnya PAID, tetapi ${state.orderPaymentStatus}.`,
    );
  }

  if (
    state.fulfillmentStatus !==
    'PROCESSING'
  ) {
    throw new Error(
      `Fulfillment seharusnya PROCESSING, tetapi ${state.fulfillmentStatus}.`,
    );
  }

  if (
    state.paymentStatus !==
    'PAID'
  ) {
    throw new Error(
      `Payment seharusnya PAID, tetapi ${state.paymentStatus}.`,
    );
  }

  if (
    state.reservationStatus !==
    'CONSUMED'
  ) {
    throw new Error(
      `Reservation seharusnya CONSUMED, tetapi ${state.reservationStatus}.`,
    );
  }

  if (
    Number(
      state.stockAfter,
    ) !== expectedStock
  ) {
    throw new Error(
      `Stock seharusnya ${expectedStock}, tetapi ${state.stockAfter}.`,
    );
  }

  if (
    Number(
      state.saleConfirmedCount,
    ) !== 1
  ) {
    throw new Error(
      `SALE_CONFIRMED seharusnya 1, tetapi ${state.saleConfirmedCount}.`,
    );
  }
}

async function cleanupFixture() {
  if (
    !fixture.orderId
  ) {
    return;
  }

  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN',
    );

    const reservations =
      await client.query(
        `
          SELECT
            "variantId",

            quantity,

            status::text
              AS status

          FROM stock_reservations

          WHERE
            "orderId" = $1

          FOR UPDATE
        `,
        [
          fixture.orderId,
        ],
      );

    for (
      const reservation
      of reservations.rows
    ) {
      if (
        reservation.status ===
        'CONSUMED'
      ) {
        await client.query(
          `
            UPDATE product_variants

            SET
              stock =
                stock + $2

            WHERE
              id = $1
          `,
          [
            reservation.variantId,

            Number(
              reservation.quantity,
            ),
          ],
        );
      }
    }

    await client.query(
      `
        DELETE FROM inventory_movements

        WHERE
          "orderId" = $1
      `,
      [
        fixture.orderId,
      ],
    );

    await client.query(
      `
        DELETE FROM stock_reservations

        WHERE
          "orderId" = $1
      `,
      [
        fixture.orderId,
      ],
    );

    await client.query(
      `
        DELETE FROM payments

        WHERE
          "orderId" = $1
      `,
      [
        fixture.orderId,
      ],
    );

    await client.query(
      `
        DELETE FROM orders

        WHERE
          id = $1
      `,
      [
        fixture.orderId,
      ],
    );

    await client.query(
      'COMMIT',
    );
  } catch (error) {
    await client.query(
      'ROLLBACK',
    );

    throw error;
  } finally {
    client.release();
  }
}

async function verifyCleanup() {
  if (
    !fixture.variantId ||
    fixture.stockBefore === null
  ) {
    return;
  }

  const result =
    await pool.query(
      `
        SELECT
          stock

        FROM product_variants

        WHERE
          id = $1
      `,
      [
        fixture.variantId,
      ],
    );

  const stock =
    Number(
      result.rows[0]?.stock,
    );

  if (
    stock !==
    fixture.stockBefore
  ) {
    throw new Error(
      `Cleanup gagal. Stock seharusnya kembali ${fixture.stockBefore}, tetapi ${stock}.`,
    );
  }
}

console.log(
  '\n=== PAYMENT PAID SETTLEMENT RUNTIME TEST ===\n',
);

let mainError =
  null;

try {
  console.log(
    '1. Membuat fixture sementara...',
  );

  await createFixture();

  console.log(
    '✅ Fixture dibuat.',
  );

  console.log(
    '\nOrder:',
    orderNumber,
  );

  console.log(
    'Variant:',
    fixture.variantId,
  );

  console.log(
    'Stock awal:',
    fixture.stockBefore,
  );

  console.log(
    'Amount:',
    fixture.amount,
  );

  console.log(
    '\n2. Mengirim webhook PAID...',
  );

  const firstResult =
    await sendPaidWebhook();

  console.log(
    'HTTP:',
    firstResult.status,
  );

  console.log(
    'Response:',
    firstResult.body,
  );

  if (
    firstResult.status !== 200 ||
    firstResult.body
      ?.responseCode !==
      '2005200'
  ) {
    throw new Error(
      'Webhook PAID pertama gagal.',
    );
  }

  const firstState =
    await inspectSettlement();

  console.log(
    '\n3. State setelah PAID:',
  );

  console.table(
    firstState
      ? [
          firstState,
        ]
      : [],
  );

  verifySettlement(
    firstState,
  );

  console.log(
    '\n✅ Payment PAID.',
  );

  console.log(
    '✅ Order PAID.',
  );

  console.log(
    '✅ Fulfillment PROCESSING.',
  );

  console.log(
    '✅ Reservation CONSUMED.',
  );

  console.log(
    '✅ Physical stock berkurang.',
  );

  console.log(
    '✅ SALE_CONFIRMED tercatat.',
  );

  console.log(
    '\n4. Mengirim webhook PAID yang sama sekali lagi...',
  );

  const secondResult =
    await sendPaidWebhook();

  console.log(
    'HTTP:',
    secondResult.status,
  );

  console.log(
    'Response:',
    secondResult.body,
  );

  if (
    secondResult.status !== 200 ||
    secondResult.body
      ?.responseCode !==
      '2005200'
  ) {
    throw new Error(
      'Webhook PAID kedua gagal.',
    );
  }

  const secondState =
    await inspectSettlement();

  console.log(
    '\n5. State setelah duplicate webhook:',
  );

  console.table(
    secondState
      ? [
          secondState,
        ]
      : [],
  );

  verifySettlement(
    secondState,
  );

  console.log(
    '\n✅ Duplicate webhook idempotent.',
  );

  console.log(
    '✅ Stock tidak berkurang dua kali.',
  );

  console.log(
    '✅ SALE_CONFIRMED tetap satu kali.',
  );

  console.log(
    '\n=== SETTLEMENT TEST PASSED ===\n',
  );
} catch (error) {
  mainError =
    error;

  console.error(
    '\n❌ SETTLEMENT TEST FAILED\n',
  );

  console.error(
    error,
  );
} finally {
  console.log(
    '\n6. Membersihkan fixture...',
  );

  try {
    await cleanupFixture();

    await verifyCleanup();

    console.log(
      '✅ Fixture dihapus.',
    );

    console.log(
      '✅ Stock dikembalikan ke nilai awal.',
    );
  } catch (
    cleanupError
  ) {
    console.error(
      '❌ CLEANUP FAILED:',
      cleanupError,
    );

    if (!mainError) {
      mainError =
        cleanupError;
    }
  }

  await pool.end();
}

if (mainError) {
  process.exitCode =
    1;
} else {
  console.log(
    '\n=== RUNTIME PAID SETTLEMENT COMPLETE ===\n',
  );
}