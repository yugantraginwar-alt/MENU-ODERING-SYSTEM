import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Multi-Tenant SaaS data...');

  // Clear existing data in reverse relation order
  await prisma.auditLog.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.floor.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.restaurant.deleteMany({});

  // 1. Create central Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "L'Ardoise Bistro Group",
      logoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80",
      address: "Central HQ, Culinary Boulevard",
      phone: "+1 (555) 700-1000",
      taxRate: 8.5,
      serviceCharge: 10.0,
      currency: "USD",
      gstNumber: "GST-L-ARDOISE-2026",
    }
  });

  // 2. Create Branches
  const branchDowntown = await prisma.branch.create({
    data: {
      name: "L'Ardoise - Downtown",
      address: "452 Premium Avenue, Culinary District",
      phone: "+1 (555) 732-8877",
      restaurantId: restaurant.id,
    }
  });

  const branchUptown = await prisma.branch.create({
    data: {
      name: "L'Ardoise - Uptown Heights",
      address: "982 Skyline Vista, Financial Hub",
      phone: "+1 (555) 909-6611",
      restaurantId: restaurant.id,
    }
  });

  // 3. Create Floors in Downtown Branch
  const floorGround = await prisma.floor.create({
    data: { name: "Ground Floor Salon", branchId: branchDowntown.id }
  });

  const floorRooftop = await prisma.floor.create({
    data: { name: "Rooftop Terrace", branchId: branchDowntown.id }
  });

  // 4. Create Tables for Downtown Branch
  // Ground Floor tables (1 to 5)
  for (let i = 1; i <= 5; i++) {
    await prisma.table.create({
      data: {
        number: `Table ${i}`,
        status: 'AVAILABLE',
        guestsCount: 4,
        restaurantId: restaurant.id,
        branchId: branchDowntown.id,
        floorId: floorGround.id,
      }
    });
  }
  // Rooftop tables (6 to 10)
  for (let i = 6; i <= 10; i++) {
    await prisma.table.create({
      data: {
        number: `Table ${i}`,
        status: 'AVAILABLE',
        guestsCount: 2,
        restaurantId: restaurant.id,
        branchId: branchDowntown.id,
        floorId: floorRooftop.id,
      }
    });
  }

  // Create Tables for Uptown Branch (11 to 15)
  for (let i = 11; i <= 15; i++) {
    await prisma.table.create({
      data: {
        number: `Table ${i}`,
        status: 'AVAILABLE',
        guestsCount: 4,
        restaurantId: restaurant.id,
        branchId: branchUptown.id,
      }
    });
  }

  // 5. Create Users with specific credentials and role hierarchy
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // Owner - full system permissions
  await prisma.user.create({
    data: {
      email: 'owner@ardoise.com',
      password: defaultPasswordHash,
      name: 'Eleanor Vance (Owner)',
      role: 'OWNER',
      restaurantId: restaurant.id,
    }
  });

  // Manager - branch managers
  await prisma.user.create({
    data: {
      email: 'manager@ardoise.com',
      password: defaultPasswordHash,
      name: 'Julian Vance (Downtown Manager)',
      role: 'MANAGER',
      restaurantId: restaurant.id,
      branchId: branchDowntown.id,
    }
  });

  // Waiter - waitstaff
  await prisma.user.create({
    data: {
      email: 'waiter@ardoise.com',
      password: defaultPasswordHash,
      name: 'Pierre Dubois (Floor Waiter)',
      role: 'WAITER',
      restaurantId: restaurant.id,
      branchId: branchDowntown.id,
    }
  });

  // Cashier - billing & payments
  await prisma.user.create({
    data: {
      email: 'cashier@ardoise.com',
      password: defaultPasswordHash,
      name: 'Clara Oswald (Front Cashier)',
      role: 'CASHIER',
      restaurantId: restaurant.id,
      branchId: branchDowntown.id,
    }
  });

  // Kitchen Chef - KDS view
  await prisma.user.create({
    data: {
      email: 'kitchen@ardoise.com',
      password: defaultPasswordHash,
      name: 'Chef Marcus Wareing (Head Chef)',
      role: 'KITCHEN',
      restaurantId: restaurant.id,
      branchId: branchDowntown.id,
    }
  });

  // Legacy compatible seed support for test log-ins
  await prisma.user.create({
    data: {
      email: 'admin@ardoise.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Legacy Admin',
      role: 'OWNER',
      restaurantId: restaurant.id,
    }
  });

  await prisma.user.create({
    data: {
      email: 'staff@ardoise.com',
      password: await bcrypt.hash('staff123', 10),
      name: 'Legacy Staff (Waiter)',
      role: 'WAITER',
      restaurantId: restaurant.id,
      branchId: branchDowntown.id,
    }
  });

  // 6. Create Menu Categories (Restaurant-wide)
  const catStarters = await prisma.category.create({
    data: { name: 'Starters & Small Plates', description: 'Curated appetizers to awaken your palate', restaurantId: restaurant.id }
  });

  const catMains = await prisma.category.create({
    data: { name: 'Artisanal Mains', description: 'Premium locally sourced entrees', restaurantId: restaurant.id }
  });

  const catPizzas = await prisma.category.create({
    data: { name: 'Wood-Fired Pizzas', description: 'Naturally fermented 48-hour sourdough crust', restaurantId: restaurant.id }
  });

  const catDesserts = await prisma.category.create({
    data: { name: 'Pastry Chef Desserts', description: 'Delectable sweets crafted daily', restaurantId: restaurant.id }
  });

  const catBeverages = await prisma.category.create({
    data: { name: 'Crafted Beverages', description: 'Signature mocktails and specialty roasts', restaurantId: restaurant.id }
  });

  // 7. Create Menu Items (Restaurant-wide)
  // Starters
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Truffle & Parmesan Pommes Frites',
        description: 'Crispy hand-cut fries, white truffle oil, grated Parmigiano-Reggiano, fresh rosemary dust.',
        price: 14.00,
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        status: 'AVAILABLE',
        categoryId: catStarters.id,
      },
      {
        name: 'Crispy Calamari Fritti',
        description: 'Lightly dusted calamari, dynamic saffron aioli, charred lemon wedges, micro-cilantro.',
        price: 19.00,
        imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isAvailable: true,
        status: 'AVAILABLE',
        categoryId: catStarters.id,
      },
      {
        name: 'Heirloom Burrata Caprese',
        description: 'Creamy burrata pugliese, organic heirloom tomatoes, basil pistou, aged dark balsamic pearls, micro-basil.',
        price: 18.50,
        imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        status: 'AVAILABLE',
        categoryId: catStarters.id,
      }
    ]
  });

  // Mains
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Dry-Aged Wagyu Ribeye',
        description: '12oz Australian Wagyu BMS 7+, compound bone marrow butter, roasted heritage root vegetables, red wine jus.',
        price: 68.00,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isAvailable: true,
        status: 'AVAILABLE',
        categoryId: catMains.id,
      },
      {
        name: 'Pan-Seared Atlantic Chilean Seabass',
        description: 'Chilean seabass filet, ginger-infused dashi broth, braised baby bok choy, wild black rice, scallion curls.',
        price: 46.00,
        imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isAvailable: true,
        status: 'AVAILABLE',
        categoryId: catMains.id,
      },
      {
        name: 'Wild Mushroom Hand-Cut Pappardelle',
        description: 'Fresh egg pappardelle, sautéed chanterelle and porcini mushrooms, black truffle cream, aged pecorino.',
        price: 32.00,
        imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        status: 'AVAILABLE',
        categoryId: catMains.id,
      }
    ]
  });

  // Pizzas
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Margherita D.O.C.',
        description: 'San Marzano tomatoes, fresh fior di latte mozzarella, organic basil, extra virgin olive oil drizzle.',
        price: 21.00,
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        status: 'AVAILABLE',
        categoryId: catPizzas.id,
      },
      {
        name: 'Spicy Calabrian Salami & Honey',
        description: 'San Marzano base, fior di latte, hot Calabrian soppressata, dynamic organic hot honey, fresh oregano.',
        price: 24.50,
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isAvailable: true,
        status: 'AVAILABLE',
        categoryId: catPizzas.id,
      }
    ]
  });

  // Desserts
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Classic Espresso Tiramisu',
        description: 'Layers of espresso-soaked ladyfingers, velvety mascarpone sabayon, dark cocoa dusting.',
        price: 12.00,
        imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        status: 'AVAILABLE',
        categoryId: catDesserts.id,
      },
      {
        name: 'Decadent Lava Fondant',
        description: 'Warm dark chocolate cake, molten liquid core, Madagascan vanilla bean gelato, fresh raspberries.',
        price: 14.00,
        imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        status: 'AVAILABLE',
        categoryId: catDesserts.id,
      }
    ]
  });

  // Beverages
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Signature Smoked Rosemary Tonic',
        description: 'Rosemary-infused tonic, fresh grapefruit juice, cold-smoked branch, dynamic orange bitter mist.',
        price: 9.50,
        imageUrl: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        status: 'AVAILABLE',
        categoryId: catBeverages.id,
      },
      {
        name: 'Premium Roasted Flat White',
        description: 'Double shot of single-origin Ethiopian espresso, micro-foamed organic oat milk.',
        price: 6.50,
        imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        status: 'AVAILABLE',
        categoryId: catBeverages.id,
      }
    ]
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
