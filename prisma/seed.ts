/**
 * Seed script for KNOOS.
 *
 * Usage:
 *   npx prisma db push
 *   npx tsx prisma/seed.ts
 *
 * Note: Users must be created via Google OAuth in production.
 * This seed only creates demo product data.
 */

import { prisma } from "../src/lib/db";
import { Gender, ProductStatus } from "../src/lib/constants";

async function main() {
  const products = [
    {
      name: "Apex Runner X1",
      gender: Gender.MEN,
      price: 2999,
      salePrice: 2499,
      sku: "KNOOS-ARX1-M-BLK-09",
      description:
        "Engineered for performance. The Apex Runner X1 combines lightweight mesh upper with responsive cushioning for a smooth, efficient stride.",
      status: ProductStatus.ACTIVE,
      images: [
        "/images/products/apex-runner-x1-1.jpg",
        "/images/products/apex-runner-x1-2.jpg",
        "/images/products/apex-runner-x1-3.jpg",
      ],
      variants: [
        { size: "8", stock: 10, sku: "KNOOS-ARX1-M-BLK-08" },
        { size: "9", stock: 15, sku: "KNOOS-ARX1-M-BLK-09" },
        { size: "10", stock: 12, sku: "KNOOS-ARX1-M-BLK-10" },
        { size: "11", stock: 8, sku: "KNOOS-ARX1-M-BLK-11" },
      ],
    },
    {
      name: "Luna Court Classic",
      gender: Gender.WOMEN,
      price: 3499,
      salePrice: null,
      sku: "KNOOS-LCC-W-WHT-07",
      description:
        "Timeless elegance meets modern comfort. Premium leather upper with cushioned insole for all-day wear.",
      status: ProductStatus.ACTIVE,
      images: [
        "/images/products/luna-court-classic-1.jpg",
        "/images/products/luna-court-classic-2.jpg",
      ],
      variants: [
        { size: "6", stock: 8, sku: "KNOOS-LCC-W-WHT-06" },
        { size: "7", stock: 12, sku: "KNOOS-LCC-W-WHT-07" },
        { size: "8", stock: 10, sku: "KNOOS-LCC-W-WHT-08" },
      ],
    },
    {
      name: "Trail Blazer Pro",
      gender: Gender.MEN,
      price: 4299,
      salePrice: 3799,
      sku: "KNOOS-TBP-M-GRY-10",
      description:
        "Conquer any terrain. Rugged outsole with reinforced toe cap and waterproof membrane built for the trail.",
      status: ProductStatus.ACTIVE,
      images: [
        "/images/products/trail-blazer-pro-1.jpg",
        "/images/products/trail-blazer-pro-2.jpg",
      ],
      variants: [
        { size: "9", stock: 6, sku: "KNOOS-TBP-M-GRY-09" },
        { size: "10", stock: 9, sku: "KNOOS-TBP-M-GRY-10" },
        { size: "11", stock: 5, sku: "KNOOS-TBP-M-GRY-11" },
      ],
    },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        gender: p.gender,
        price: p.price,
        salePrice: p.salePrice,
        sku: p.sku,
        description: p.description,
        slug: slugify(p.name),
        status: p.status,
        images: {
          create: p.images.map((url, i) => ({ imageUrl: url, sortOrder: i })),
        },
        variants: {
          create: p.variants.map((v) => ({
            size: v.size,
            stock: v.stock,
            sku: v.sku,
          })),
        },
      },
    });
    console.log(`Created product: ${p.name}`);
  }

  console.log("Seed complete.");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
