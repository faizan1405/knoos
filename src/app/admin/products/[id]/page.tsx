import { Metadata } from "next";
import { prisma } from "@/lib/db";
import AdminProductForm from "./ProductForm";

export const metadata: Metadata = {
  title: "Edit Product — Admin",
};

async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { size: "asc" } },
    },
  });
  return product;
}

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return (
      <div className="p-8">
        <h1 className="font-serif text-3xl mb-4">Product Not Found</h1>
        <p className="text-brand-gray-500 font-mono text-sm">The product you are looking for does not exist.</p>
        <a href="/admin/products" className="inline-block mt-6 text-sm font-mono uppercase tracking-wide hover:underline">
          Back to Products
        </a>
      </div>
    );
  }

  return <AdminProductForm product={product} />;
}
