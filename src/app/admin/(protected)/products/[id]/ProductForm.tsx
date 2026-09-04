"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const GENDERS = ["MEN", "WOMEN"] as const;

type FieldErrors = Record<string, string>;

interface Variant {
  id: string;
  size: string;
  stock: number;
  sku: string;
  price: number;
  salePrice: number | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  gender: string;
  sku: string;
  price: number;
  salePrice: number | null;
  status: string;
  description: string | null;
  category: string | null;
  color: string | null;
  subCategory: string | null;
  upperMaterial: string | null;
  innerMaterial: string | null;
  sole: string | null;
  images: { id: string; imageUrl: string; sortOrder: number }[];
  variants: Variant[];
}

export default function AdminProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState("MEN");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [sku, setSku] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [upperMaterial, setUpperMaterial] = useState("");
  const [innerMaterial, setInnerMaterial] = useState("");
  const [sole, setSole] = useState("");

  const [variants, setVariants] = useState<
    Array<{ id?: string; size: string; stock: string; sku: string; price: string; salePrice: string }>
  >([{ size: "", stock: "0", sku: "", price: "", salePrice: "" }]);

  const [images, setImages] = useState<
    Array<{ id?: string; imageUrl: string; sortOrder: number }>
  >([]);
  const [imageUrlInput, setImageUrlInput] = useState("");

  // Load product for edit mode
  useEffect(() => {
    if (!productId) return;

    let cancelled = false;

    async function loadProduct() {
      try {
        const res = await fetch(`/api/admin/products/${productId}`);
        if (!res.ok) throw new Error("Failed to load product");
        const data: Product = await res.json();

        if (cancelled) return;

        setName(data.name);
        setSlug(data.slug);
        setDescription(data.description ?? "");
        setGender(data.gender);
        setPrice(data.price.toString());
        setSalePrice(data.salePrice?.toString() ?? "");
        setSku(data.sku);
        setStatus(data.status);
        setCategory(data.category ?? "");
        setColor(data.color ?? "");
        setSubCategory(data.subCategory ?? "");
        setUpperMaterial(data.upperMaterial ?? "");
        setInnerMaterial(data.innerMaterial ?? "");
        setSole(data.sole ?? "");

        setImages(
          data.images?.length
            ? data.images.map((img) => ({ id: img.id, imageUrl: img.imageUrl, sortOrder: img.sortOrder }))
            : []
        );

        if (data.variants?.length) {
          setVariants(
            data.variants.map((v) => ({
              id: v.id,
              size: v.size,
              stock: v.stock.toString(),
              sku: v.sku,
              price: v.price.toString(),
              salePrice: v.salePrice?.toString() ?? "",
            }))
          );
        }
      } catch {
        if (!cancelled) setError("Failed to load product");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const generateSlug = useCallback(() => {
    const s = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(s);
  }, [name]);

  const addVariant = () => {
    setVariants((v) => [...v, { size: "", stock: "0", sku: "", price: "", salePrice: "" }]);
  };

  const removeVariant = (index: number) => {
    setVariants((v) => v.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string) => {
    setVariants((v) => v.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addImage = () => {
    if (imageUrlInput.trim()) {
      setImages((imgs) => [...imgs, { imageUrl: imageUrlInput.trim(), sortOrder: imgs.length }]);
      setImageUrlInput("");
    }
  };

  const removeImage = (index: number) => {
    setImages((imgs) => imgs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const priceNum = parseInt(price, 10);
    const salePriceNum = salePrice ? parseInt(salePrice, 10) : null;

    if (isNaN(priceNum) || priceNum <= 0) {
      setFieldErrors({ price: "MRP / Original Price is required and must be greater than zero" });
      setSaving(false);
      return;
    }

    if (salePriceNum !== null && salePriceNum > priceNum) {
      setFieldErrors({ salePrice: "Selling Price cannot exceed MRP" });
      setSaving(false);
      return;
    }

    const payload: Record<string, unknown> = {
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
      variants: variants
        .filter((v) => v.size.trim())
        .map((v) => ({
          id: v.id,
          size: v.size,
          stock: parseInt(v.stock, 10) || 0,
          sku: v.sku || `${slug}-${v.size}`.toLowerCase(),
          price: v.price ? parseInt(v.price, 10) || 0 : 0,
          salePrice: v.salePrice ? parseInt(v.salePrice, 10) : null,
        })),
    };

    try {
      const url = productId ? `/api/admin/products/${productId}` : "/api/admin/products";
      const method = productId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setError(data.error || "Failed to save product");
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

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-brand-gray-400 font-mono text-sm">Loading product...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl">{productId ? "Edit Product" : "Add Product"}</h1>
        <p className="text-brand-gray-500 font-mono text-sm mt-1">
          {productId ? "Update product pricing and details" : "Create a new product in your catalog"}
        </p>
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

          {/* Name */}
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
              className={`w-full border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors ${fieldErrors.name ? "border-red-300" : "border-brand-gray-200"}`}
              placeholder="Premium White Leather Sneaker"
            />
            {fieldErrors.name && <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>}
          </div>

          {/* Slug */}
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
                placeholder="premium-white-leather-sneaker"
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

          {/* Gender + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gender" className="block font-mono text-xs uppercase tracking-wide mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
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

          {/* Description */}
          <div>
            <label htmlFor="description" className="block font-mono text-xs uppercase tracking-wide mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={`w-full border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors ${fieldErrors.description ? "border-red-300" : "border-brand-gray-200"}`}
              placeholder="Product description..."
            />
            {fieldErrors.description && <p className="text-red-600 text-xs mt-1">{fieldErrors.description}</p>}
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block font-mono text-xs uppercase tracking-wide mb-2">Category</label>
              <input id="category" type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                className={`w-full border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors ${fieldErrors.category ? "border-red-300" : "border-brand-gray-200"}`} placeholder="e.g. MEN BOOTS" />
              {fieldErrors.category && <p className="text-red-600 text-xs mt-1">{fieldErrors.category}</p>}
            </div>
            <div>
              <label htmlFor="color" className="block font-mono text-xs uppercase tracking-wide mb-2">Color</label>
              <input id="color" type="text" value={color} onChange={(e) => setColor(e.target.value)}
                className={`w-full border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors ${fieldErrors.color ? "border-red-300" : "border-brand-gray-200"}`} placeholder="e.g. Black" />
              {fieldErrors.color && <p className="text-red-600 text-xs mt-1">{fieldErrors.color}</p>}
            </div>
            <div>
              <label htmlFor="subCategory" className="block font-mono text-xs uppercase tracking-wide mb-2">Sub Category</label>
              <input id="subCategory" type="text" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}
                className={`w-full border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors ${fieldErrors.subCategory ? "border-red-300" : "border-brand-gray-200"}`} placeholder="e.g. CHELSEA BOOTS" />
              {fieldErrors.subCategory && <p className="text-red-600 text-xs mt-1">{fieldErrors.subCategory}</p>}
            </div>
            <div>
              <label htmlFor="upperMaterial" className="block font-mono text-xs uppercase tracking-wide mb-2">Upper Material</label>
              <input id="upperMaterial" type="text" value={upperMaterial} onChange={(e) => setUpperMaterial(e.target.value)}
                className={`w-full border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors ${fieldErrors.upperMaterial ? "border-red-300" : "border-brand-gray-200"}`} placeholder="e.g. Synthetic" />
              {fieldErrors.upperMaterial && <p className="text-red-600 text-xs mt-1">{fieldErrors.upperMaterial}</p>}
            </div>
            <div>
              <label htmlFor="innerMaterial" className="block font-mono text-xs uppercase tracking-wide mb-2">Inner Material</label>
              <input id="innerMaterial" type="text" value={innerMaterial} onChange={(e) => setInnerMaterial(e.target.value)}
                className={`w-full border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors ${fieldErrors.innerMaterial ? "border-red-300" : "border-brand-gray-200"}`} placeholder="e.g. Synthetic" />
              {fieldErrors.innerMaterial && <p className="text-red-600 text-xs mt-1">{fieldErrors.innerMaterial}</p>}
            </div>
            <div>
              <label htmlFor="sole" className="block font-mono text-xs uppercase tracking-wide mb-2">Sole</label>
              <input id="sole" type="text" value={sole} onChange={(e) => setSole(e.target.value)}
                className={`w-full border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors ${fieldErrors.sole ? "border-red-300" : "border-brand-gray-200"}`} placeholder="e.g. TPR" />
              {fieldErrors.sole && <p className="text-red-600 text-xs mt-1">{fieldErrors.sole}</p>}
            </div>
          </div>
        </div>

        {/* Pricing — product-level fallback pricing */}
        <div className="bg-white border border-brand-gray-200 p-6 mb-6 space-y-5">
          <h2 className="font-serif text-lg pb-4 border-b border-brand-gray-100">Product Pricing</h2>
          <p className="text-xs text-brand-gray-500 -mt-3 mb-4">
            Used as fallback when no variants exist. Variant prices below override these values on the storefront.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block font-mono text-xs uppercase tracking-wide mb-2">
                MRP / Original Price (INR) <span className="text-red-500">*</span>
              </label>
              <input
                id="price"
                type="number"
                min="1"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className={`w-full border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors ${fieldErrors.price ? "border-red-300" : "border-brand-gray-200"}`}
                placeholder="4999"
              />
              {fieldErrors.price && <p className="text-red-600 text-xs mt-1">{fieldErrors.price}</p>}
            </div>
            <div>
              <label htmlFor="salePrice" className="block font-mono text-xs uppercase tracking-wide mb-2">
                Selling Price (INR)
              </label>
              <input
                id="salePrice"
                type="number"
                min="0"
                step="1"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className={`w-full border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-black transition-colors ${fieldErrors.salePrice ? "border-red-300" : "border-brand-gray-200"}`}
                placeholder="3999"
              />
              {fieldErrors.salePrice && <p className="text-red-600 text-xs mt-1">{fieldErrors.salePrice}</p>}
            </div>
          </div>

          {/* Discount display — read-only, calculated from entered values */}
          <div className="flex items-center gap-6 pt-3 border-t border-brand-gray-100">
            <span className="font-mono text-xs uppercase tracking-wide text-brand-gray-500">Discount</span>
            <span className="font-mono text-sm font-medium">
              {(() => {
                const mrpVal = parseInt(price, 10);
                const spVal = salePrice ? parseInt(salePrice, 10) : NaN;
                if (!isNaN(mrpVal) && !isNaN(spVal) && mrpVal > 0 && spVal <= mrpVal) {
                  const pct = Math.round(((mrpVal - spVal) / mrpVal) * 100);
                  return `${pct}% OFF`;
                }
                if (!isNaN(mrpVal) && (isNaN(spVal) || spVal >= mrpVal)) {
                  return "0% OFF";
                }
                return "—";
              })()}
            </span>
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

        {/* Sizes / Variants with individual pricing */}
        <div className="bg-white border border-brand-gray-200 p-6 mb-6">
          <h2 className="font-serif text-lg pb-4 border-b border-brand-gray-100 mb-5">
            Size Variants
            <span className="text-brand-gray-400 text-sm font-mono normal-case tracking-normal ml-2">
              Each variant can have its own MRP and Selling Price
            </span>
          </h2>

          {variants.map((variant, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 mb-4 items-start">
              <div className="col-span-2">
                <label className="block font-mono text-[10px] uppercase tracking-wide text-brand-gray-400 mb-1">Size</label>
                <input
                  type="text"
                  value={variant.size}
                  onChange={(e) => updateVariant(index, "size", e.target.value)}
                  placeholder="6"
                  className="w-full border border-brand-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-mono text-[10px] uppercase tracking-wide text-brand-gray-400 mb-1">Stock</label>
                <input
                  type="number"
                  value={variant.stock}
                  onChange={(e) => updateVariant(index, "stock", e.target.value)}
                  placeholder="10"
                  min="0"
                  className="w-full border border-brand-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
                />
              </div>
              <div className="col-span-3">
                <label className="block font-mono text-[10px] uppercase tracking-wide text-brand-gray-400 mb-1">Variant SKU</label>
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) => updateVariant(index, "sku", e.target.value)}
                  placeholder="KNOOS-6"
                  className="w-full border border-brand-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand-black transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-mono text-[10px] uppercase tracking-wide text-brand-gray-400 mb-1">MRP</label>
                <input
                  type="number"
                  value={variant.price}
                  onChange={(e) => updateVariant(index, "price", e.target.value)}
                  placeholder="4999"
                  min="0"
                  step="1"
                  className="w-full border border-brand-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-mono text-[10px] uppercase tracking-wide text-brand-gray-400 mb-1">Selling</label>
                <input
                  type="number"
                  value={variant.salePrice}
                  onChange={(e) => updateVariant(index, "salePrice", e.target.value)}
                  placeholder="3999"
                  min="0"
                  step="1"
                  className="w-full border border-brand-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-black transition-colors"
                />
              </div>
              <div className="col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  disabled={variants.length === 1}
                  className="w-full py-2 text-brand-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 text-xs"
                  title="Remove variant"
                >
                  x
                </button>
              </div>
            </div>
          ))}

          {fieldErrors.variants && (
            <p className="text-red-600 text-xs mt-1 mb-2">{fieldErrors.variants}</p>
          )}

          <button
            type="button"
            onClick={addVariant}
            className="mt-2 text-xs font-mono uppercase tracking-wide text-brand-gray-500 hover:text-brand-black border border-brand-gray-200 px-4 py-2 transition-colors"
          >
            + Add Size Variant
          </button>
        </div>

        {/* Images */}
        <div className="bg-white border border-brand-gray-200 p-6 mb-6">
          <h2 className="font-serif text-lg pb-4 border-b border-brand-gray-100 mb-5">
            Images
            <span className="text-brand-gray-400 text-sm font-mono normal-case tracking-normal ml-2">Paste image URLs</span>
          </h2>

          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              {images.map((img, index) => (
                <div key={img.id ?? index} className="relative group">
                  <Image
                    src={img.imageUrl}
                    alt={`Product ${index + 1}`}
                    width={100}
                    height={100}
                    className="w-full aspect-square object-cover border border-brand-gray-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext fill='%239a9a9a' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='12'%3EError%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-black/70 text-white w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
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
              className="px-4 border border-brand-gray-200 text-xs font-mono uppercase hover:border-brand-black transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-black text-white px-8 py-3 font-mono text-sm uppercase tracking-wide hover:bg-brand-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : productId ? "Update Product" : "Save Product"}
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
