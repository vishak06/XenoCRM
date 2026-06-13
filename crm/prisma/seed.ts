import { PrismaClient, Prisma } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// ============================================
// Configuration
// ============================================
const NUM_CUSTOMERS = 150;
const MIN_ORDERS_PER_CUSTOMER = 1;
const MAX_ORDERS_PER_CUSTOMER = 8;

const CITIES = [
  "Mumbai",
  "Bangalore",
  "Delhi",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Kolkata",
  "Jaipur",
  "Ahmedabad",
  "Lucknow",
];

const TAGS_POOL = [
  "vip",
  "new",
  "churn-risk",
  "loyalty-member",
  "sale-shopper",
  "high-value",
  "returning",
  "dormant",
  "referral",
  "premium",
];

// Apparel brand product catalog
const PRODUCT_CATALOG = [
  { name: "Classic Leather Jacket", category: "Jackets", price: 4999 },
  { name: "Bomber Jacket", category: "Jackets", price: 3499 },
  { name: "Denim Jacket", category: "Jackets", price: 2999 },
  { name: "Puffer Jacket", category: "Jackets", price: 5499 },
  { name: "Running Shoes", category: "Shoes", price: 3999 },
  { name: "Casual Sneakers", category: "Shoes", price: 2499 },
  { name: "Leather Boots", category: "Shoes", price: 4499 },
  { name: "Loafers", category: "Shoes", price: 1999 },
  { name: "Sports Sandals", category: "Shoes", price: 1499 },
  { name: "Graphic Tee", category: "T-Shirts", price: 799 },
  { name: "Polo Shirt", category: "T-Shirts", price: 1299 },
  { name: "Henley T-Shirt", category: "T-Shirts", price: 999 },
  { name: "Oversized Tee", category: "T-Shirts", price: 899 },
  { name: "Slim Fit Jeans", category: "Denim", price: 2299 },
  { name: "Ripped Jeans", category: "Denim", price: 2499 },
  { name: "Straight Fit Jeans", category: "Denim", price: 1999 },
  { name: "Denim Shorts", category: "Denim", price: 1499 },
  { name: "Leather Belt", category: "Accessories", price: 799 },
  { name: "Canvas Backpack", category: "Accessories", price: 1899 },
  { name: "Aviator Sunglasses", category: "Accessories", price: 1299 },
  { name: "Watch", category: "Accessories", price: 3499 },
  { name: "Wool Scarf", category: "Accessories", price: 699 },
  { name: "Baseball Cap", category: "Accessories", price: 499 },
  { name: "Chinos", category: "Trousers", price: 1799 },
  { name: "Joggers", category: "Trousers", price: 1499 },
  { name: "Formal Trousers", category: "Trousers", price: 2199 },
  { name: "Hoodie", category: "Sweatshirts", price: 1899 },
  { name: "Crewneck Sweatshirt", category: "Sweatshirts", price: 1699 },
  { name: "Zip-Up Hoodie", category: "Sweatshirts", price: 2099 },
];

// ============================================
// Helper Functions
// ============================================

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = faker.number.int({ min, max: Math.min(max, arr.length) });
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateOrderItems(): Array<{
  name: string;
  category: string;
  qty: number;
  price: number;
}> {
  const numItems = faker.number.int({ min: 1, max: 4 });
  const items: Array<{ name: string; category: string; qty: number; price: number }> = [];

  for (let i = 0; i < numItems; i++) {
    const product = randomFromArray(PRODUCT_CATALOG);
    const qty = faker.number.int({ min: 1, max: 3 });
    items.push({
      name: product.name,
      category: product.category,
      qty,
      price: product.price,
    });
  }

  return items;
}

// ============================================
// Main Seed Function
// ============================================

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Clean existing data
  console.log("🗑️  Cleaning existing data...");
  await prisma.communicationLog.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  console.log("✅ Existing data cleaned\n");

  // ---- Generate Customers ----
  console.log(`👤 Generating ${NUM_CUSTOMERS} customers...`);
  const customers: Array<{ id: string; email: string }> = [];

  for (let i = 0; i < NUM_CUSTOMERS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const city = randomFromArray(CITIES);

    // Assign tags based on some logic for realism
    const tags: string[] = [];
    const tagCount = faker.number.int({ min: 0, max: 3 });
    const availableTags = randomSubset(TAGS_POOL, tagCount, tagCount);
    tags.push(...availableTags);

    const customer = await prisma.customer.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        phone: `+91${faker.string.numeric(10)}`,
        city,
        totalSpend: new Prisma.Decimal(0), // Will be recalculated
        lastOrderDate: null, // Will be recalculated
        tags,
      },
    });

    customers.push({ id: customer.id, email: customer.email });
  }
  console.log(`✅ Created ${customers.length} customers\n`);

  // ---- Generate Orders ----
  console.log("📦 Generating orders...");
  let totalOrders = 0;

  for (const customer of customers) {
    const numOrders = faker.number.int({
      min: MIN_ORDERS_PER_CUSTOMER,
      max: MAX_ORDERS_PER_CUSTOMER,
    });

    for (let j = 0; j < numOrders; j++) {
      const items = generateOrderItems();
      const amount = items.reduce((sum, item) => sum + item.price * item.qty, 0);

      // Orders spread across the last 365 days
      const orderDate = faker.date.between({
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        to: new Date(),
      });

      await prisma.order.create({
        data: {
          customerId: customer.id,
          amount: new Prisma.Decimal(amount),
          items: items as unknown as Prisma.JsonArray,
          orderDate,
        },
      });

      totalOrders++;
    }
  }
  console.log(`✅ Created ${totalOrders} orders\n`);

  // ---- Recalculate Customer Aggregates ----
  console.log("🔄 Recalculating customer aggregates...");
  for (const customer of customers) {
    const orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      select: { amount: true, orderDate: true },
      orderBy: { orderDate: "desc" },
    });

    const totalSpend = orders.reduce(
      (sum, order) => sum.add(order.amount),
      new Prisma.Decimal(0)
    );
    const lastOrderDate = orders.length > 0 ? orders[0].orderDate : null;

    // Update tags based on calculated data for realism
    const tags: string[] = [];
    const totalSpendNum = totalSpend.toNumber();

    if (totalSpendNum > 20000) tags.push("vip");
    if (totalSpendNum > 30000) tags.push("high-value");
    if (totalSpendNum < 3000) tags.push("new");

    if (lastOrderDate) {
      const daysSinceLastOrder =
        (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastOrder > 90) tags.push("churn-risk");
      if (daysSinceLastOrder > 180) tags.push("dormant");
      if (daysSinceLastOrder <= 30) tags.push("returning");
    }

    // Add some random extras
    if (Math.random() < 0.3) tags.push("loyalty-member");
    if (Math.random() < 0.2) tags.push("sale-shopper");
    if (Math.random() < 0.1) tags.push("referral");
    if (Math.random() < 0.15) tags.push("premium");

    // Deduplicate tags
    const uniqueTags = [...new Set(tags)];

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalSpend,
        lastOrderDate,
        tags: uniqueTags,
      },
    });
  }
  console.log("✅ Customer aggregates recalculated\n");

  // ---- Create Example Segments ----
  console.log("📊 Creating example segments...");
  await prisma.segment.createMany({
    data: [
      {
        name: "High-Value Bangalore Customers",
        description: "Customers in Bangalore who have spent over ₹10,000",
        ruleDefinition: {
          combinator: "AND",
          conditions: [
            { field: "city", operator: "equals", value: "Bangalore" },
            { field: "totalSpend", operator: "greaterThan", value: 10000 },
          ],
        },
      },
      {
        name: "Churn Risk — 60 Days Inactive",
        description:
          "Customers who haven't ordered in the last 60 days",
        ruleDefinition: {
          combinator: "AND",
          conditions: [
            { field: "lastOrderDate", operator: "olderThanDays", value: 60 },
          ],
        },
      },
      {
        name: "VIP Customers",
        description: "Customers tagged as VIP",
        ruleDefinition: {
          combinator: "AND",
          conditions: [
            { field: "tags", operator: "contains", value: "vip" },
          ],
        },
      },
      {
        name: "New Mumbai Shoppers",
        description:
          "New customers in Mumbai who have spent less than ₹3,000",
        ruleDefinition: {
          combinator: "AND",
          conditions: [
            { field: "city", operator: "equals", value: "Mumbai" },
            { field: "totalSpend", operator: "lessThan", value: 3000 },
            { field: "tags", operator: "contains", value: "new" },
          ],
        },
      },
    ],
  });
  console.log("✅ Created 4 example segments\n");

  // ---- Summary ----
  const customerCount = await prisma.customer.count();
  const orderCount = await prisma.order.count();
  const segmentCount = await prisma.segment.count();

  console.log("========================================");
  console.log("🎉 Seed completed successfully!");
  console.log(`   Customers: ${customerCount}`);
  console.log(`   Orders:    ${orderCount}`);
  console.log(`   Segments:  ${segmentCount}`);
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
