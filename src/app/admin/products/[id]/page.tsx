import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Product — Admin",
};

export default function AdminEditProductPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Edit Product</h1>
      <p className="text-brand-gray-500 font-mono text-sm">
        Editing product ID: {params.id}
      </p>
      <p className="text-brand-gray-400 font-mono text-sm mt-2">Edit form — Phase 4</p>
    </div>
  );
}
