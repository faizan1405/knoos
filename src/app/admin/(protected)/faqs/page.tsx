"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, GripVertical, Check, X } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  order: number;
}

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FAQ>>({});
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/admin/faqs");
      const data = await res.json();
      if (Array.isArray(data)) {
        setFaqs(data);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (isNew: boolean) => {
    try {
      const method = isNew ? "POST" : "PUT";
      const body = isNew ? { ...editForm, order: faqs.length } : editForm;
      
      const res = await fetch("/api/admin/faqs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsEditing(null);
        setIsCreating(false);
        setEditForm({});
        fetchFaqs();
      } else {
        alert("Failed to save FAQ");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving FAQ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const res = await fetch(`/api/admin/faqs?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchFaqs();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleActive = async (faq: FAQ) => {
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: faq.id, isActive: !faq.isActive }),
      });
      if (res.ok) fetchFaqs();
    } catch (error) {
      console.error(error);
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newFaqs = [...faqs];
    const temp = newFaqs[index].order;
    newFaqs[index].order = newFaqs[index - 1].order;
    newFaqs[index - 1].order = temp;
    
    // swap positions in array for UI
    const tempFaq = newFaqs[index];
    newFaqs[index] = newFaqs[index - 1];
    newFaqs[index - 1] = tempFaq;
    setFaqs(newFaqs);

    await saveOrder(newFaqs);
  };

  const moveDown = async (index: number) => {
    if (index === faqs.length - 1) return;
    const newFaqs = [...faqs];
    const temp = newFaqs[index].order;
    newFaqs[index].order = newFaqs[index + 1].order;
    newFaqs[index + 1].order = temp;
    
    // swap
    const tempFaq = newFaqs[index];
    newFaqs[index] = newFaqs[index + 1];
    newFaqs[index + 1] = tempFaq;
    setFaqs(newFaqs);

    await saveOrder(newFaqs);
  };

  const saveOrder = async (items: FAQ[]) => {
    try {
      await fetch("/api/admin/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reorder: true,
          items: items.map(f => ({ id: f.id, order: f.order }))
        }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl">Manage FAQs</h1>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditForm({ question: "", answer: "", isActive: true });
          }}
          className="flex items-center gap-2 bg-brand-black text-white px-4 py-2 text-sm font-mono uppercase tracking-widest rounded-sm hover:bg-brand-gray-900 transition-colors"
        >
          <Plus size={16} /> Add FAQ
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-sm shadow-sm border border-brand-gray-200 mb-8">
          <h2 className="font-serif text-xl mb-4">New FAQ</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono mb-2">Question</label>
              <input
                type="text"
                className="w-full border p-2 text-sm"
                value={editForm.question || ""}
                onChange={e => setEditForm({ ...editForm, question: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-mono mb-2">Answer</label>
              <textarea
                className="w-full border p-2 text-sm h-32"
                value={editForm.answer || ""}
                onChange={e => setEditForm({ ...editForm, answer: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleSave(true)}
                className="bg-brand-black text-white px-4 py-2 text-sm font-mono hover:bg-brand-gray-900"
              >
                Save
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="text-brand-gray-500 hover:text-black font-mono text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-sm shadow-sm border border-brand-gray-200">
        {faqs.length === 0 ? (
          <div className="p-8 text-center text-brand-gray-400 font-mono">No FAQs found.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-gray-200 bg-brand-gray-50 font-mono text-xs uppercase tracking-widest text-brand-gray-500">
                <th className="p-4 w-16">Order</th>
                <th className="p-4">Question</th>
                <th className="p-4 w-32">Status</th>
                <th className="p-4 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq, index) => (
                <tr key={faq.id} className="border-b border-brand-gray-100 last:border-0 hover:bg-brand-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col items-center gap-1 text-brand-gray-400">
                      <button disabled={index === 0} onClick={() => moveUp(index)} className="hover:text-black disabled:opacity-30">▲</button>
                      <button disabled={index === faqs.length - 1} onClick={() => moveDown(index)} className="hover:text-black disabled:opacity-30">▼</button>
                    </div>
                  </td>
                  <td className="p-4">
                    {isEditing === faq.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          className="w-full border p-1 text-sm"
                          value={editForm.question || ""}
                          onChange={e => setEditForm({ ...editForm, question: e.target.value })}
                        />
                        <textarea
                          className="w-full border p-1 text-sm h-20"
                          value={editForm.answer || ""}
                          onChange={e => setEditForm({ ...editForm, answer: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium mb-1">{faq.question}</div>
                        <div className="text-sm text-brand-gray-500 line-clamp-2">{faq.answer}</div>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(faq)}
                      className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest transition-colors ${
                        faq.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-brand-gray-100 text-brand-gray-500 hover:bg-brand-gray-200"
                      }`}
                    >
                      {faq.isActive ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    {isEditing === faq.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleSave(false)} className="text-green-600 hover:text-green-800" title="Save">
                          <Check size={18} />
                        </button>
                        <button onClick={() => setIsEditing(null)} className="text-brand-gray-400 hover:text-black" title="Cancel">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-3 text-brand-gray-400">
                        <button 
                          onClick={() => {
                            setIsEditing(faq.id);
                            setEditForm(faq);
                          }} 
                          className="hover:text-brand-black transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(faq.id)} className="hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
