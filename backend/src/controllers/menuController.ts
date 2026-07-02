import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

// --- Categories ---
export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        menuItems: true,
      },
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error retrieving categories' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  const { name, description, restaurantId } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Default to first restaurant if not provided
    let targetRestId = restaurantId;
    if (!targetRestId) {
      const rest = await prisma.restaurant.findFirst();
      if (!rest) return res.status(400).json({ error: 'No restaurant found' });
      targetRestId = rest.id;
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        restaurantId: targetRestId,
      },
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Server error creating category' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: { name, description },
    });
    res.json(updated);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Server error updating category' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Server error deleting category' });
  }
};

// --- Menu Items ---
export const getMenuItems = async (req: AuthRequest, res: Response) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      include: {
        category: true,
      },
    });
    res.json(menuItems);
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ error: 'Server error retrieving menu items' });
  }
};

export const createMenuItem = async (req: AuthRequest, res: Response) => {
  const { name, description, price, imageUrl, isVeg, isAvailable, categoryId } = req.body;

  try {
    if (!name || price === undefined || !categoryId) {
      return res.status(400).json({ error: 'Name, price, and categoryId are required' });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        imageUrl: imageUrl || '',
        isVeg: Boolean(isVeg),
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        categoryId,
      },
    });
    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ error: 'Server error creating menu item' });
  }
};

export const updateMenuItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, price, imageUrl, isVeg, isAvailable, categoryId } = req.body;

  try {
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = parseFloat(price);
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (isVeg !== undefined) data.isVeg = Boolean(isVeg);
    if (isAvailable !== undefined) data.isAvailable = Boolean(isAvailable);
    if (categoryId !== undefined) data.categoryId = categoryId;

    const updated = await prisma.menuItem.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Server error updating menu item' });
  }
};

export const deleteMenuItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.menuItem.delete({ where: { id } });
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Server error deleting menu item' });
  }
};
