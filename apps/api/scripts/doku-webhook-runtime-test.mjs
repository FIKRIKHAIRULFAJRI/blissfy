import {
  createHash,
  createHmac,
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

const clientId =
  getEnvValue(
    'DOKU_CLIENT_ID',
  );

const clientSecret =
  getEnvValue(
    'DOKU_SECRET_KEY',
  );

const endpointPath =
  '/v1.0/qr/qr-mpm-notify';

const endpointUrl =
  `http://localhost:3002${endpointPath}`;

const accessToken =
  'local-runtime-test-token';

const timestamp =
  new Date()
    .toISOString()
    .replace(
      /\.\d{3}Z$/,
      'Z',
    );

const uniqueId =
  Date.now();

const body = {
  originalReferenceNo:
    `DOKU-RUNTIME-${uniqueId}`,

  originalPartnerReferenceNo:
    `BLS-RUNTIME-${uniqueId}`,

  latestTransactionStatus:
    '03',

  transactionStatusDesc:
    'Pending',

  amount: {
    value:
      '10000.00',

    currency:
      'IDR',
  },

  transactionDate:
    timestamp,

  additionalInfo: {
    source:
      'local-runtime-test',
  },
};

const requestBody =
  JSON.stringify(
    body,
  );

function createSignature() {
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

async function sendWebhook(
  signature,
) {
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
              uniqueId,
            ),

          'X-SIGNATURE':
            signature,
        },

        body:
          requestBody,
      },
    );

  let responseBody;

  try {
    responseBody =
      await response.json();
  } catch {
    responseBody = {
      message:
        'Response bukan JSON.',
    };
  }

  return {
    status:
      response.status,

    body:
      responseBody,
  };
}

console.log(
  '\n=== DOKU QRIS Webhook Runtime Test ===\n',
);

console.log(
  '1. Menguji signature salah...',
);

const invalidResult =
  await sendWebhook(
    'invalid-signature',
  );

console.log(
  'HTTP:',
  invalidResult.status,
);

console.log(
  'Response:',
  invalidResult.body,
);

if (
  invalidResult.status !== 401 ||
  invalidResult.body
    ?.responseCode !==
    '4015200'
) {
  throw new Error(
    'Test signature invalid gagal.',
  );
}

console.log(
  '\n✅ Signature salah berhasil ditolak.\n',
);

console.log(
  '2. Menguji signature valid...',
);

const validSignature =
  createSignature();

const validResult =
  await sendWebhook(
    validSignature,
  );

console.log(
  'HTTP:',
  validResult.status,
);

console.log(
  'Response:',
  validResult.body,
);

if (
  validResult.status !== 404 ||
  validResult.body
    ?.responseCode !==
    '4045200'
) {
  throw new Error(
    'Request valid tidak mencapai payment lookup sesuai harapan.',
  );
}

console.log(
  '\n✅ Signature valid diterima.',
);

console.log(
  '✅ Payload berhasil diparse.',
);

console.log(
  '✅ Adapter berhasil dijalankan.',
);

console.log(
  '✅ PaymentStatusProcessor berhasil dicapai.',
);

console.log(
  '✅ Database lookup berhasil dijalankan.',
);

console.log(
  '\n4045200 memang expected karena runtime test menggunakan reference payment palsu.',
);

console.log(
  '\n=== RUNTIME TEST PASSED ===\n',
);