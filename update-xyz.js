const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existingProduct = await prisma.product.findUnique({
    where: { sku: "UD-5002-BL" }
  });

  if (!existingProduct) {
    console.error("Product UD-5002-BL not found!");
    process.exit(1);
  }

  console.log("Found existing product ID:", existingProduct.id);

  const updatedProduct = await prisma.product.update({
    where: { id: existingProduct.id },
    data: {
      name: "xyz",
      color: "Black",
      category: "MEN BOOTS",
      gender: "MEN",
      subCategory: "CHELSEA BOOTS",
      upperMaterial: "Synthetic",
      innerMaterial: "Synthetic",
      sole: "TPR",
      description: "blank",
      price: 2499
    },
    include: {
      variants: true
    }
  });

  console.log("Successfully updated product!");
  console.log("Product:");
  console.log(`- Name: ${updatedProduct.name}`);
  console.log(`- Parent SKU: ${updatedProduct.sku}`);
  console.log(`- Color: ${updatedProduct.color}`);
  console.log(`- Category: ${updatedProduct.category}`);
  console.log(`- Gender: ${updatedProduct.gender}`);
  console.log(`- Sub Category: ${updatedProduct.subCategory}`);
  console.log(`- Upper Material: ${updatedProduct.upperMaterial}`);
  console.log(`- Inner Material: ${updatedProduct.innerMaterial}`);
  console.log(`- Sole: ${updatedProduct.sole}`);
  console.log(`- Description: ${updatedProduct.description}`);
  console.log(`- Price: ${updatedProduct.price}`);
  
  console.log("\nVariants:");
  updatedProduct.variants.forEach(v => {
    console.log(`- SKU: ${v.sku} | Size: ${v.size} | Stock: ${v.stock}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
