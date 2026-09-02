"use client";

import { useState, useEffect } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Review {
  id: string;
  productId: string;
  userId: string | null;
  displayName: string;
  rating: number;
  reviewText: string;
  isActive: boolean;
  createdAt: string;
  product?: {
    name: string;
    slug: string;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (review: Review) => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id, isActive: !review.isActive }),
      });
      if (res.ok) fetchReviews();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchReviews();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl">Manage Reviews</h1>
      </div>

      <div className="bg-white rounded-sm shadow-sm border border-brand-gray-200">
        {reviews.length === 0 ? (
          <div className="p-8 text-center text-brand-gray-400 font-mono">No reviews found.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-brand-gray-200 bg-brand-gray-50 font-mono text-xs uppercase tracking-widest text-brand-gray-500">
                <th className="p-4">Customer</th>
                <th className="p-4">Product</th>
                <th className="p-4">Rating & Review</th>
                <th className="p-4 w-32">Status</th>
                <th className="p-4 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-b border-brand-gray-100 last:border-0 hover:bg-brand-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-brand-black">{review.displayName}</div>
                    <div className="text-xs text-brand-gray-400 font-mono mt-1">
                      {format(new Date(review.createdAt), "MMM d, yyyy")}
                    </div>
                  </td>
                  <td className="p-4">
                    {review.product ? (
                      <Link 
                        href={`/product/${review.product.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-brand-black hover:underline"
                      >
                        {review.product.name}
                        <ExternalLink size={12} className="text-brand-gray-400" />
                      </Link>
                    ) : (
                      <span className="text-brand-gray-400">Unknown Product</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-brand-black mb-1">
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </div>
                    <div className="text-sm text-brand-gray-500 line-clamp-2" title={review.reviewText}>
                      {review.reviewText}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(review)}
                      className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest transition-colors ${
                        review.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      }`}
                    >
                      {review.isActive ? "Approved" : "Pending"}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(review.id)} className="text-brand-gray-400 hover:text-red-500 transition-colors" title="Delete">
                      <Trash2 size={16} />
                    </button>
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
