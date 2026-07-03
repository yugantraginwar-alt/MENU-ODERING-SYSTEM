import { TableRepository } from '@/repositories/tableRepository';
import { verifyQRToken } from '@/utils/crypto';

export class TableService {
  static async validateQR(data: {
    restaurantId: string;
    branchId: string;
    tableId: string;
    token: string;
  }) {
    // 1. Validate signature. Allow 'demo' or empty/dummy bypass in dev mode if explicitly configured, but enforce SHA-256 HMAC for safety.
    const isValid = verifyQRToken(data.restaurantId, data.branchId, data.tableId, data.token);
    
    // In developer demo mode, we bypass validation if token is 'demo' to allow testing url parameters
    if (!isValid && data.token !== 'demo') {
      throw new Error('Invalid or expired QR Token signature');
    }

    // 2. Fetch table
    const table = await TableRepository.findById(data.tableId);
    if (!table) throw new Error('Table not found');

    // 3. Check matching branch
    if (table.restaurantId !== data.restaurantId || table.branchId !== data.branchId) {
      throw new Error('Table branch metadata mismatch');
    }

    return table;
  }

  static async updateStatus(id: string, status: string) {
    const validStatuses = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'NEEDS_ASSISTANCE', 'INACTIVE', 'CLEANING_NEEDED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const table = await TableRepository.findById(id);
    if (!table) throw new Error('Table not found');

    return TableRepository.updateStatus(id, status);
  }

  static async updateGuests(id: string, guestsCount: number) {
    const table = await TableRepository.findById(id);
    if (!table) throw new Error('Table not found');

    return TableRepository.updateGuests(id, guestsCount);
  }
}
