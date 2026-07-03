import crypto from 'crypto';

const QR_SECRET = process.env.QR_SECRET || 'premium_qr_ordering_system_qr_secret_key_2026';

/**
 * Generates a cryptographically secure token/signature for a specific table configuration.
 */
export const generateQRToken = (restaurantId: string, branchId: string, tableId: string): string => {
  return crypto
    .createHmac('sha256', QR_SECRET)
    .update(`${restaurantId}:${branchId}:${tableId}`)
    .digest('hex');
};

/**
 * Validates that the provided token matches the expected signature for a given table configuration.
 */
export const verifyQRToken = (
  restaurantId: string,
  branchId: string,
  tableId: string,
  token: string
): boolean => {
  if (!token) return false;
  const expected = generateQRToken(restaurantId, branchId, tableId);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
};
