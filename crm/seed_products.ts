import { prisma } from "./src/lib/prisma";

const AVAILABLE_PRODUCTS = [
  { id: "p1", name: "Premium T-Shirt", category: "Apparel", price: 1500 },
  { id: "p2", name: "Denim Jeans", category: "Apparel", price: 3000 },
  { id: "p3", name: "Running Sneakers", category: "Footwear", price: 5000 },
  { id: "p4", name: "Wireless Earbuds", category: "Electronics", price: 4500 },
  { id: "p5", name: "Coffee Mug", category: "Accessories", price: 500 },
];

async function main() {
  for (const product of AVAILABLE_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
      },
    });
  }
  console.log("Successfully seeded products table.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
