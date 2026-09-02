const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Test Connection
    await prisma.$connect();
    console.log("Database connection successful.");

    const variantSkus = [
      'UD-5002-BL-6',
      'UD-5002-BL-7',
      'UD-5002-BL-8',
      'UD-5002-BL-9',
      'UD-5002-BL-10'
    ];

    // 2. Check for existing SKUs
    const existingVariants = await prisma.productVariant.findMany({
      where: {
        sku: { in: variantSkus }
      }
    });

    if (existingVariants.length > 0) {
      console.error("STOP: Duplicates found for the following SKUs:");
      existingVariants.forEach(v => console.error(` - ${v.sku}`));
      return;
    }

    // Also check if Parent SKU already exists to prevent unique constraint error
    const existingProduct = await prisma.product.findUnique({
      where: { sku: 'UD-5002-BL' }
    });
    
    if (existingProduct) {
      console.error("STOP: Product with parent SKU 'UD-5002-BL' already exists.");
      return;
    }

    // 3. Insert Product and Variants in one transaction
    const result = await prisma.$transaction(async (tx) => {
      return await tx.product.create({
        data: {
          name: "xyz",
          slug: "xyz",
          sku: "UD-5002-BL",
          description: "blank",
          price: 2499,
          category: "MEN BOOTS",
          gender: "MEN",
          variants: {
            create: [
              { sku: 'UD-5002-BL-6', size: '6', stock: 10 },
              { sku: 'UD-5002-BL-7', size: '7', stock: 10 },
              { sku: 'UD-5002-BL-8', size: '8', stock: 10 },
              { sku: 'UD-5002-BL-9', size: '9', stock: 10 },
              { sku: 'UD-5002-BL-10', size: '10', stock: 10 }
            ]
          }
        },
        include: {
          variants: true
        }
      });
    });

    console.log("SUCCESS: Product and variants inserted successfully!");
    console.log(`Created Product: ${result.name} (SKU: ${result.sku})`);
    console.log(`Created Variants: ${result.variants.length}`);
    result.variants.forEach(v => {
      console.log(` - SKU: ${v.sku} | Size: ${v.size} | Stock: ${v.stock}`);
    });

  } catch (error) {
    console.error("Transaction failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
