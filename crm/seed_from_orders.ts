import { prisma } from "./src/lib/prisma";

async function main() {
  const orders = await prisma.order.findMany();
  let addedCount = 0;
  
  const existingProducts = await prisma.product.findMany();
  const existingProductNames = new Set(existingProducts.map(p => p.name.toLowerCase()));

  for (const order of orders) {
    const items = order.items as Array<{ name: string; category: string; qty: number; price: number }>;
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (!item.name) continue;
      
      const normalizedName = item.name.toLowerCase();
      if (!existingProductNames.has(normalizedName)) {
        await prisma.product.create({
          data: {
            name: item.name,
            category: item.category || "Uncategorized",
            price: item.price || 0,
          }
        });
        existingProductNames.add(normalizedName);
        addedCount++;
        console.log(`Added new product from orders: ${item.name}`);
      }
    }
  }

  console.log(`Successfully added ${addedCount} new products from order history.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
