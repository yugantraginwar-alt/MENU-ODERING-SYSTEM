import { Response } from 'express';
import * as QRCode from 'qrcode';
import { prisma } from '@/config/db';
import { AuthRequest } from '@/middleware/auth';
import { TableRepository } from '@/repositories/tableRepository';
import { TableService } from '@/services/tableService';
import { generateQRToken } from '@/utils/crypto';
import { logAudit } from '@/utils/auditLogger';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

export const getTables = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.query;
    
    // Filter tables by branch if requested
    const filters: any = {};
    if (branchId) filters.branchId = String(branchId);
    
    const tables = await TableRepository.findAll(filters);
    res.json(tables);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ error: 'Server error retrieving tables' });
  }
};

export const createTable = async (req: AuthRequest, res: Response) => {
  const { number, guestsCount, restaurantId, branchId, floorId } = req.body;

  try {
    if (!number) {
      return res.status(400).json({ error: 'Table number is required' });
    }

    let targetRestId = restaurantId;
    let targetBranchId = branchId;

    if (!targetRestId || !targetBranchId) {
      const branch = await prisma.branch.findFirst({
        include: { restaurant: true },
      });
      if (!branch) return res.status(400).json({ error: 'No branch registered. Create a branch first.' });
      targetRestId = targetRestId || branch.restaurantId;
      targetBranchId = targetBranchId || branch.id;
    }

    // 1. Create table record
    const table = await TableRepository.create({
      number,
      guestsCount: guestsCount ? parseInt(guestsCount) : 4,
      restaurantId: targetRestId,
      branchId: targetBranchId,
      floorId,
    });

    // 2. Generate signed QR URL containing tenant scope and encrypted signature
    const token = generateQRToken(targetRestId, targetBranchId, table.id);
    const menuUrl = `${CLIENT_URL}/menu?r=${targetRestId}&b=${targetBranchId}&t=${table.id}&token=${token}`;

    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      color: {
        dark: '#0A0A0A',
        light: '#FFFFFF',
      },
      width: 512,
      margin: 2,
    });

    // 3. Save QR data URL
    const updatedTable = await prisma.table.update({
      where: { id: table.id },
      data: { qrCodeUrl: qrCodeDataUrl },
      include: { floor: true, branch: true },
    });

    // Log action
    await logAudit({
      userId: req.user?.id,
      restaurantId: targetRestId,
      branchId: targetBranchId,
      action: 'MENU_CHANGE',
      details: { message: `Created Table ${number}`, tableId: table.id },
    });

    res.status(201).json(updatedTable);
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ error: 'Server error creating table' });
  }
};

export const deleteTable = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const table = await TableRepository.findById(id);
    if (!table) return res.status(404).json({ error: 'Table not found' });

    await TableRepository.delete(id);

    await logAudit({
      userId: req.user?.id,
      restaurantId: table.restaurantId,
      branchId: table.branchId,
      action: 'MENU_CHANGE',
      details: { message: `Deleted Table ${table.number}`, tableId: id },
    });

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ error: 'Server error deleting table' });
  }
};

export const getTableDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const table = await TableRepository.findById(id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    console.error('Get table details error:', error);
    res.status(500).json({ error: 'Server error retrieving table details' });
  }
};

/**
 * Validates cryptographically signed QR Code parameters.
 */
export const validateQR = async (req: AuthRequest, res: Response) => {
  const { r, b, t, token } = req.query;

  try {
    if (!r || !b || !t || !token) {
      return res.status(400).json({ error: 'Invalid URL parameters. Missing QR signature metadata.' });
    }

    const table = await TableService.validateQR({
      restaurantId: String(r),
      branchId: String(b),
      tableId: String(t),
      token: String(token),
    });

    res.json(table);
  } catch (error: any) {
    console.error('Validate QR error:', error);
    res.status(400).json({ error: error.message || 'QR Validation failed' });
  }
};

/**
 * Updates table status and emits real-time updates.
 */
export const updateTableStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const table = await TableService.updateStatus(id, status);

    const io = req.app.get('io');
    if (io) {
      io.emit('table_updated', table);
    }

    res.json(table);
  } catch (error: any) {
    console.error('Update table status error:', error);
    res.status(400).json({ error: error.message || 'Failed to update table status' });
  }
};

/**
 * Updates table guest count.
 */
export const updateTableGuests = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { guestsCount } = req.body;

  try {
    const table = await TableService.updateGuests(id, parseInt(guestsCount) || 2);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('table_updated', table);
    }
    
    res.json(table);
  } catch (error: any) {
    console.error('Update guests error:', error);
    res.status(400).json({ error: error.message || 'Failed to update guests count' });
  }
};
