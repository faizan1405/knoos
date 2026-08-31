import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Product — Admin",
};

export default function AdminNewProductPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Add Product</h1>
      <form className="max-w-2xl space-y-6">
        <Field label="Product Name" name="name" type="text" required />
        <Field label="Gender" name="gender" type="select" options={["MEN", "WOMEN"]} required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (INR)" name="price" type="number" required />
          <Field label="Sale Price" name="salePrice" type="number" />
        </div>
        <Field label="SKU" name="sku" type="text" required />
        <Field label="Description" name="description" type="textarea" />
        <button
          type="submit"
          className="bg-brand-black text-white px-8 py-3 font-mono text-sm uppercase tracking-wide hover:bg-brand-gray-800 transition-colors"
        >
          Save Product
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  options,
  required,
}: {
  label: string;
  name: string;
  type: string;
  options?: string[];
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block font-mono text-sm uppercase tracking-wide mb-2">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          rows={4}
          required={required}
          className="w-full border border-brand-gray-200 px-4 py-2 focus:outline-none focus:border-brand-black transition-colors"
        />
      ) : type === "select" && options ? (
        <select
          id={name}
          name={name}
          required={required}
          className="w-full border border-brand-gray-200 px-4 py-2 focus:outline-none focus:border-brand-black transition-colors"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          className="w-full border border-brand-gray-200 px-4 py-2 focus:outline-none focus:border-brand-black transition-colors"
        />
      )}
    </div>
  );
}
