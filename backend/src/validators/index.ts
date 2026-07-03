/**
 * Simple request payload validators.
 */

export const validateLogin = (body: any) => {
  if (!body.email || typeof body.email !== 'string') {
    throw new Error('Valid email is required');
  }
  if (!body.password || typeof body.password !== 'string' || body.password.length < 4) {
    throw new Error('Password must be at least 4 characters long');
  }
};

export const validateOrderCreate = (body: any) => {
  if (!body.tableId || typeof body.tableId !== 'string') {
    throw new Error('Table ID is required');
  }
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    throw new Error('At least one order item is required');
  }
  for (const item of body.items) {
    if (!item.menuItemId || typeof item.menuItemId !== 'string') {
      throw new Error('Each order item must contain a menuItemId');
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      throw new Error('Each order item must contain a positive quantity');
    }
  }
};

export const validateTableCreate = (body: any) => {
  if (!body.number || typeof body.number !== 'string') {
    throw new Error('Table number is required');
  }
  if (!body.branchId || typeof body.branchId !== 'string') {
    throw new Error('Branch ID is required');
  }
};
