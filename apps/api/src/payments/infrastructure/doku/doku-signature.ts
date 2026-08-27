import { createHash, createHmac, createSign } from 'node:crypto';

export function createDokuTimestamp(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function createDokuB2bSignature(input: {
  clientId: string;
  timestamp: string;
  privateKey: string;
}) {
  const stringToSign = `${input.clientId}|${input.timestamp}`;

  const signer = createSign('RSA-SHA256');

  signer.update(stringToSign);
  signer.end();

  return signer.sign(input.privateKey, 'base64');
}

export function createDokuBodyHash(requestBody: string) {
  return createHash('sha256').update(requestBody).digest('hex').toLowerCase();
}

export function createDokuSymmetricSignature(input: {
  method: string;
  endpointPath: string;
  accessToken: string;
  requestBody: string;
  timestamp: string;
  clientSecret: string;
}) {
  const bodyHash = createDokuBodyHash(input.requestBody);

  const stringToSign = [
    input.method.toUpperCase(),
    input.endpointPath,
    input.accessToken,
    bodyHash,
    input.timestamp,
  ].join(':');

  return createHmac('sha512', input.clientSecret)
    .update(stringToSign)
    .digest('base64');
}
