import { Response } from 'express';
import * as QRCode from 'qrcode';
import { prisma } from '@/config/db';
import { AuthRequest } from '@/middleware/auth';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

export const getTables = async (req: AuthRequest, res: Response) => {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { number: 'asc' },
    });
    res.json(tables);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ error: 'Server error retrieving tables' });
  }
};

export const createTable = async (req: AuthRequest, res: Response) => {
  const { number, restaurantId } = req.body;

  try {
    if (!number) {
      return res.status(400).json({ error: 'Table number is required' });
    }

    let targetRestId = restaurantId;
    if (!targetRestId) {
      const rest = await prisma.restaurant.findFirst();
      if (!rest) return res.status(400).json({ error: 'No restaurant found' });
      targetRestId = rest.id;
    }

    // 1. Create the table in database first to get its ID
    const table = await prisma.table.create({
      data: {
        number,
        status: 'AVAILABLE',
        restaurantId: targetRestId,
      },
    });

    // 2. Generate the QR code pointing to the customer ordering page
    const menuUrl = `${CLIENT_URL}/menu?tableId=${table.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      color: {
        dark: '#0A0A0A',
        light: '#FFFFFF',
      },
      width: 512,
      margin: 2,
    });

    // 3. Update the table with the QR code URL
    const updatedTable = await prisma.table.update({
      where: { id: table.id },
      data: { qrCodeUrl: qrCodeDataUrl },
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
    await prisma.table.delete({ where: { id } });
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ error: 'Server error deleting table' });
  }
};

export const getTableDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        restaurant: true,
      },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json(table);
  } catch (error) {
    console.error('Get table details error:', error);
    res.status(500).json({ error: 'Server error retrieving table details' });
  }
};
