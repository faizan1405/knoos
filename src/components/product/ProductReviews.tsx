"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { loginWithGoogle } from "@/lib/auth-actions";

interface Review {
  id: string;
  displayName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
}

export function ProductReviews({ productId, reviews }: ProductReviewsProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await loginWithGoogle(window.location.pathname);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, reviewText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      setSubmitSuccess(true);
      setReviewText("");
      setRating(5);
    } catch (error: any) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-24 pt-16 border-t border-brand-gray-100 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="font-serif text-3xl md:text-4xl text-brand-black mb-4">Customer Reviews</h2>
        {reviews.length > 0 ? (
          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl text-black">
              {"★".repeat(Math.round(Number(averageRating)))}{"☆".repeat(5 - Math.round(Number(averageRating)))}
            </div>
            <div className="font-mono text-sm text-brand-gray-500">
              {averageRating} out of 5 &nbsp;|&nbsp; Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </div>
          </div>
        ) : (
          <div className="font-mono text-sm text-brand-gray-400">
            Be the first to review this product.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Review List */}
        <div className="md:col-span-7 space-y-8">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="border-b border-brand-gray-100 pb-8 last:border-0">
                <div className="flex items-center gap-1 text-black mb-2 text-lg">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </div>
                <p className="text-brand-gray-600 mb-4 leading-relaxed">{review.reviewText}</p>
                <div className="font-mono text-xs text-brand-gray-400 uppercase tracking-widest flex items-center justify-between">
                  <span>{review.displayName}</span>
                  <span>{format(new Date(review.createdAt), "MMM d, yyyy")}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-8 bg-brand-gray-50 rounded-sm">
              <p className="text-brand-gray-500 font-mono text-sm">No reviews yet.</p>
            </div>
          )}
        </div>

        {/* Review Form */}
        <div className="md:col-span-5">
          <div className="bg-brand-gray-50 p-6 md:p-8 rounded-sm">
            <h3 className="font-serif text-2xl mb-6">Write a Review</h3>
            
            {submitSuccess ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-sm text-sm border border-green-200">
                Thank you for your review! It has been submitted and is pending approval.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-brand-gray-500 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-colors ${
                          rating >= star ? "text-black" : "text-brand-gray-300 hover:text-brand-gray-400"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-brand-gray-500 mb-2">
                    Your Review
                  </label>
                  <textarea
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full border border-brand-gray-200 p-3 text-sm focus:outline-none focus:border-brand-black transition-colors min-h-[120px]"
                    placeholder="What do you think about this product?"
                  />
                </div>

                {submitError && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-sm">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || authLoading}
                  className="w-full bg-brand-black text-white font-mono text-xs uppercase tracking-widest py-4 hover:bg-brand-gray-900 transition-colors disabled:opacity-50"
                >
                  {authLoading ? "Loading..." :
                   isSubmitting ? "Submitting..." : 
                   user ? "Submit Review" : "Sign In to Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
