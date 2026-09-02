const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: {
      variants: true
    }
  });

  console.log("DATABASE:");
  console.log(`Total Products: ${products.length}`);
  console.log("\nProducts:");
  products.forEach((p, i) => {
    console.log(`${i + 1}. ID: ${p.id} | Name: ${p.name} | SKU: ${p.sku} | Gender: ${p.gender} | Category: ${p.category} | Price: ${p.price} | Slug: ${p.slug} | Status: ${p.status} | Variants: ${p.variants.length}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
