"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const GENDERS = ["MEN", "WOMEN"] as const;

interface ProductImage {
  id: string;
  imageUrl: string;
  sortOrder: number;
}

interface ProductVariant {
  id: string;
  size: string;
  stock: number;
  sku: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  gender: string;
  category: string | null;
  color: string | null;
  subCategory: string | null;
  upperMaterial: string | null;
  innerMaterial: string | null;
  sole: string | null;
  price: number;
  salePrice: number | null;
  sku: string;
  status: string;
  images: ProductImage[];
  variants: ProductVariant[];
}

type FieldErrors = Record<string, string>;

export default function AdminProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [description, setDescription] = useState(product.description || "");
  const [gender, setGender] = useState(product.gender);
  const [price, setPrice] = useState(product.price.toString());
  const [salePrice, setSalePrice] = useState(product.salePrice?.toString() ?? "");
  const [sku, setSku] = useState(product.sku);
  const [status, setStatus] = useState(product.status);
  const [category, setCategory] = useState(product.category || "");
  const [color, setColor] = useState(product.color || "");
  const [subCategory, setSubCategory] = useState(product.subCategory || "");
  const [upperMaterial, setUpperMaterial] = useState(product.upperMaterial || "");
  const [innerMaterial, setInnerMaterial] = useState(product.innerMaterial || "");
  const [sole, setSole] = useState(product.sole || "");

  const [variants, setVariants] = useState<ProductVariant[]>(product.variants);
  const [newVariant, setNewVariant] = useState({ size: "", stock: "0", sku: "" });

  const [images, setImages] = useState<ProductImage[]>(product.images);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const generateSlug = () => {
    const s = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(s);
  };

  const addVariant = async () => {
    if (!newVariant.size) return;
    setActionLoading("new-variant");

    try {
      const res = await fetch(`/api/admin/products/${product.id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: newVariant.size,
          stock: parseInt(newVariant.stock, 10) || 0,
          sku: newVariant.sku || `${slug}-${newVariant.size}`.toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to add variant");
      } else {
        setVariants((v) => [...v, data]);
        setNewVariant({ size: "", stock: "0", sku: "" });
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const removeVariant = async (variantId: string, size: string) => {
    if (!confirm(`Remove size ${size}?`)) return;
    setActionLoading(variantId);

    try {
      const res = await fetch(`/api/admin/products/${product.id}/variants?variantId=${variantId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to remove variant");
      } else {
        setVariants((v) => v.filter((item) => item.id !== variantId));
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const addImage = async () => {
    if (!imageUrlInput.trim()) return;
    setActionLoading("image-add");

    try {
      const res = await fetch(`/api/admin/products/${product.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageUrlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to add image");
      } else {
        setImages((imgs) => [...imgs, data]);
        setImageUrlInput("");
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const removeImage = async (imageId: string) => {
    setActionLoading(imageId);

    try {
      const res = await fetch(`/api/admin/products/${product.id}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      if (!res.ok) {
        alert("Failed to remove image");
      } else {
        setImages((imgs) => imgs.filter((img) => img.id !== imageId));
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const priceNum = parseInt(price, 10);
    const salePriceNum = salePrice ? parseInt(salePrice, 10) : null;

    const payload = {
      name,
      slug,
      description: description || null,
      gender,
      price: priceNum,
      salePrice: salePriceNum,
      sku,
      status,
      category: category || null,
      color: color || null,
      subCategory: subCategory || null,
      upperMaterial: upperMaterial || null,
      innerMaterial: innerMaterial || null,
      sole: sole || null,
      images: images.map((img, i) => ({ imageUrl: img.imageUrl, sortOrder: img.sortOrder ?? i })),
      variants: variants.map((v) => ({
        id: v.id,
        size: v.size,
        stock: v.stock,
        sku: v.sku,
      })),
    };

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setError(data.error || "Failed to update product");
        setSaving(false);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  };

  const inputClass = (fieldError?: string) =>
    `w-full border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors ${
      fieldError ? "border-red-300" : "border-brand-gray-200"
    }`;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Edit Product</h1>
        <p className="text-brand-gray-500 font-mono text-sm mt-1">Update product details, pricing, and inventory</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl">
        {/* Basic Info */}
        <div className="bg-white border border-brand-gray-200 p-6 mb-6 space-y-5">
          <h2 className="font-serif text-lg pb-4 border-b border-brand-gray-100">Product Information</h2>

          <div>
            <label htmlFor="name" className="block font-mono text-xs uppercase tracking-wide mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass(fieldErrors.name)}
              placeholder="Product name"
            />
            {fieldErrors.name && <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="slug" className="block font-mono text-xs uppercase tracking-wide mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className={`flex-1 border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors font-mono ${fieldErrors.slug ? "border-red-300" : "border-brand-gray-200"}`}
              />
              <button
                type="button"
                onClick={generateSlug}
                className="px-4 border border-brand-gray-200 text-xs font-mono uppercase hover:border-brand-black transition-colors"
              >
                Generate
              </button>
            </div>
            {fieldErrors.slug && <p className="text-red-600 text-xs mt-1">{fieldErrors.slug}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gender" className="block font-mono text-xs uppercase tracking-wide mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border border-brand-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors"
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block font-mono text-xs uppercase tracking-wide mb-2">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-brand-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block font-mono text-xs uppercase tracking-wide mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={inputClass(fieldErrors.description)}
              placeholder="Product description..."
            />
            {fieldErrors.description && <p className="text-red-600 text-xs mt-1">{fieldErrors.description}</p>}
          </div>

          {/* New Specifications Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block font-mono text-xs uppercase tracking-wide mb-2">Category</label>
              <input id="category" type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                className={inputClass(fieldErrors.category)} placeholder="e.g. MEN BOOTS" />
              {fieldErrors.category && <p className="text-red-600 text-xs mt-1">{fieldErrors.category}</p>}
            </div>
            <div>
              <label htmlFor="color" className="block font-mono text-xs uppercase tracking-wide mb-2">Color</label>
              <input id="color" type="text" value={color} onChange={(e) => setColor(e.target.value)}
                className={inputClass(fieldErrors.color)} placeholder="e.g. Black" />
              {fieldErrors.color && <p className="text-red-600 text-xs mt-1">{fieldErrors.color}</p>}
            </div>
            <div>
              <label htmlFor="subCategory" className="block font-mono text-xs uppercase tracking-wide mb-2">Sub Category</label>
              <input id="subCategory" type="text" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}
                className={inputClass(fieldErrors.subCategory)} placeholder="e.g. CHELSEA BOOTS" />
              {fieldErrors.subCategory && <p className="text-red-600 text-xs mt-1">{fieldErrors.subCategory}</p>}
            </div>
            <div>
              <label htmlFor="upperMaterial" className="block font-mono text-xs uppercase tracking-wide mb-2">Upper Material</label>
              <input id="upperMaterial" type="text" value={upperMaterial} onChange={(e) => setUpperMaterial(e.target.value)}
                className={inputClass(fieldErrors.upperMaterial)} placeholder="e.g. Synthetic" />
              {fieldErrors.upperMaterial && <p className="text-red-600 text-xs mt-1">{fieldErrors.upperMaterial}</p>}
            </div>
            <div>
              <label htmlFor="innerMaterial" className="block font-mono text-xs uppercase tracking-wide mb-2">Inner Material</label>
              <input id="innerMaterial" type="text" value={innerMaterial} onChange={(e) => setInnerMaterial(e.target.value)}
                className={inputClass(fieldErrors.innerMaterial)} placeholder="e.g. Synthetic" />
              {fieldErrors.innerMaterial && <p className="text-red-600 text-xs mt-1">{fieldErrors.innerMaterial}</p>}
            </div>
            <div>
              <label htmlFor="sole" className="block font-mono text-xs uppercase tracking-wide mb-2">Sole</label>
              <input id="sole" type="text" value={sole} onChange={(e) => setSole(e.target.value)}
                className={inputClass(fieldErrors.sole)} placeholder="e.g. TPR" />
              {fieldErrors.sole && <p className="text-red-600 text-xs mt-1">{fieldErrors.sole}</p>}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-brand-gray-200 p-6 mb-6 space-y-5">
          <h2 className="font-serif text-lg pb-4 border-b border-brand-gray-100">Pricing</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block font-mono text-xs uppercase tracking-wide mb-2">
                Price (INR) <span className="text-red-500">*</span>
              </label>
              <input
                id="price"
                type="number"
                min="1"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className={inputClass(fieldErrors.price)}
                placeholder="4999"
              />
              {fieldErrors.price && <p className="text-red-600 text-xs mt-1">{fieldErrors.price}</p>}
            </div>
            <div>
              <label htmlFor="salePrice" className="block font-mono text-xs uppercase tracking-wide mb-2">
                Sale Price (INR)
              </label>
              <input
                id="salePrice"
                type="number"
                min="0"
                step="1"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className={inputClass(fieldErrors.salePrice)}
                placeholder="3999"
              />
              {fieldErrors.salePrice && <p className="text-red-600 text-xs mt-1">{fieldErrors.salePrice}</p>}
            </div>
          </div>
        </div>

        {/* SKU */}
        <div className="bg-white border border-brand-gray-200 p-6 mb-6">
          <h2 className="font-serif text-lg pb-4 border-b border-brand-gray-100 mb-5">SKU</h2>
          <div>
            <label htmlFor="sku" className="block font-mono text-xs uppercase tracking-wide mb-2">
              Product SKU <span className="text-red-500">*</span>
            </label>
            <input
              id="sku"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              className={`w-full border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors font-mono ${fieldErrors.sku ? "border-red-300" : "border-brand-gray-200"}`}
              placeholder="KNOOS-M-001"
            />
            {fieldErrors.sku && <p className="text-red-600 text-xs mt-1">{fieldErrors.sku}</p>}
          </div>
        </div>

        {/* Sizes / Variants */}
        <div className="bg-white border border-brand-gray-200 p-6 mb-6">
          <h2 className="font-serif text-lg pb-4 border-b border-brand-gray-100 mb-5">
            Sizes &amp; Stock
          </h2>

          {variants.length > 0 && (
            <div className="space-y-2 mb-4">
              {variants.map((variant) => (
                <div key={variant.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-2 font-mono text-sm">{variant.size}</div>
                  <div className="col-span-2 font-mono text-sm text-center">
                    <input
                      type="number"
                      value={variant.stock}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (isNaN(val) || val < 0) return;
                        setVariants((v) =>
                          v.map((item) =>
                            item.id === variant.id ? { ...item, stock: val } : item
                          )
                        );
                      }}
                      min="0"
                      className={`w-full border px-2 py-1 text-sm text-center focus:outline-none focus:border-brand-black transition-colors ${variant.stock === 0 ? "border-red-300" : "border-brand-gray-200"}`}
                    />
                  </div>
                  <div className="col-span-4 font-mono text-xs text-brand-gray-500 truncate" title={variant.sku}>
                    {variant.sku}
                  </div>
                  <div className="col-span-4 text-right">
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id, variant.size)}
                      disabled={actionLoading === variant.id}
                      className="text-xs font-mono text-brand-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === variant.id ? "..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {variants.length === 0 && (
            <p className="text-brand-gray-400 text-xs font-mono mb-4">No sizes added yet</p>
          )}

          {/* Add new variant */}
          <div className="grid grid-cols-12 gap-2 items-end pt-4 border-t border-brand-gray-100">
            <div className="col-span-2">
              <input
                type="text"
                value={newVariant.size}
                onChange={(e) => setNewVariant((n) => ({ ...n, size: e.target.value }))}
                placeholder="Size"
                className="w-full border border-brand-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                value={newVariant.stock}
                onChange={(e) => setNewVariant((n) => ({ ...n, stock: e.target.value }))}
                placeholder="Stock"
                min="0"
                className="w-full border border-brand-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
              />
            </div>
            <div className="col-span-4">
              <input
                type="text"
                value={newVariant.sku}
                onChange={(e) => setNewVariant((n) => ({ ...n, sku: e.target.value }))}
                placeholder="Variant SKU (optional)"
                className="w-full border border-brand-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand-black transition-colors"
              />
            </div>
            <div className="col-span-4">
              <button
                type="button"
                onClick={addVariant}
                disabled={!newVariant.size || actionLoading !== null}
                className="w-full py-2 text-xs font-mono uppercase tracking-wide border border-brand-gray-200 hover:border-brand-black transition-colors disabled:opacity-30"
              >
                {actionLoading === "new-variant" ? "Adding..." : "+ Add Size"}
              </button>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white border border-brand-gray-200 p-6 mb-6">
          <h2 className="font-serif text-lg pb-4 border-b border-brand-gray-100 mb-5">
            Images
          </h2>

          {images.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-4">
              {images.map((img, index) => (
                <div key={img.id} className="relative group">
                  <Image
                    src={img.imageUrl}
                    alt={`${name} ${index + 1}`}
                    width={100}
                    height={100}
                    className="w-full aspect-square object-cover border border-brand-gray-100"
                  />
                  <div className="absolute top-0 left-0 bg-black/50 text-white text-xs px-1.5 py-0.5 font-mono">
                    {index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    disabled={actionLoading === img.id}
                    className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && (
            <p className="text-brand-gray-400 text-xs font-mono mb-4">No images added yet</p>
          )}

          <div className="flex gap-2">
            <input
              type="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 border border-brand-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
            />
            <button
              type="button"
              onClick={addImage}
              disabled={!imageUrlInput.trim()}
              className="px-4 border border-brand-gray-200 text-xs font-mono uppercase hover:border-brand-black transition-colors disabled:opacity-30"
            >
              Add
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mb-12">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-black text-white px-8 py-3 font-mono text-sm uppercase tracking-wide hover:bg-brand-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href="/admin/products"
            className="px-8 py-3 border border-brand-gray-200 font-mono text-sm uppercase tracking-wide hover:border-brand-black transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
