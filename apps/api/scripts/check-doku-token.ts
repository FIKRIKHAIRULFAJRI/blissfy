import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import {
  DokuAuthClient,
  DokuAuthError,
} from '../src/payments/infrastructure/doku/doku-auth.client';

async function main() {
  const app = await NestFactory.createApplicationContext(
    AppModule,
    {
      logger: false,
    },
  );

  try {
    const dokuAuthClient = app.get(DokuAuthClient);

    const result = await dokuAuthClient.getB2bToken();

    console.log('DOKU B2B authentication successful.');
    console.log(
      `responseCode: ${result.responseCode ?? '-'}`,
    );
    console.log(
      `tokenType: ${result.tokenType}`,
    );
    console.log(
      `expiresIn: ${result.expiresIn}`,
    );
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  if (error instanceof DokuAuthError) {
    console.error(
      'DOKU B2B authentication failed.',
    );

    console.error(
      `HTTP status: ${error.status}`,
    );

    console.error(
      `responseCode: ${error.responseCode ?? '-'}`,
    );

    console.error(
      `message: ${error.message}`,
    );

    process.exitCode = 1;

    return;
  }

  console.error(
    'DOKU B2B authentication failed.',
  );

  console.error(
    `error: ${
      error instanceof Error
        ? error.message
        : 'Unknown error'
    }`,
  );

  process.exitCode = 1;
});