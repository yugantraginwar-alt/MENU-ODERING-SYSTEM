import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '@/config/db';
import { AuthRequest } from '@/middleware/auth';
import { validateLogin } from '@/validators';
import { logAudit } from '@/utils/auditLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'premium_qr_ordering_system_secret_key_2026';

export const login = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Validate payload
    validateLogin(req.body);
    const { email, password } = req.body;

    // 2. Fetch user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { restaurant: true, branch: true },
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 4. Sign JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        restaurantId: user.restaurantId,
        branchId: user.branchId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Track audit log
    await logAudit({
      userId: user.id,
      restaurantId: user.restaurantId || undefined,
      branchId: user.branchId || undefined,
      action: 'LOGIN',
      details: { email: user.email, name: user.name, role: user.role },
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
        branchId: user.branchId,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message || 'Server error during login' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        restaurantId: true,
        branchId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error retrieving profile' });
  }
};
