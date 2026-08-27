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

const cronSecret =
  getEnvValue(
    'CRON_SECRET',
  );

const endpoint =
  'http://localhost:3002/v1/orders/release-expired';

console.log(
  '\n=== RELEASE EXPIRED RESERVATIONS ===\n',
);

const response =
  await fetch(
    endpoint,
    {
      method:
        'POST',

      headers: {
        Accept:
          'application/json',

        'Content-Type':
          'application/json',

        'x-cron-secret':
          cronSecret,
      },
    },
  );

let body;

try {
  body =
    await response.json();
} catch {
  body = null;
}

console.log(
  'HTTP:',
  response.status,
);

console.log(
  'Response:',
  body,
);

if (
  !response.ok
) {
  throw new Error(
    'Release expired reservations gagal.',
  );
}

if (
  body?.ok !== true
) {
  throw new Error(
    'Response maintenance tidak sesuai.',
  );
}

console.log(
  '\nReleased:',
  body.releasedCount,
);

console.log(
  '\n✅ EXPIRED RESERVATION CLEANUP SELESAI\n',
);