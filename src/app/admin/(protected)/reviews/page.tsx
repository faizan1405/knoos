"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Image as ImageIcon,
  User as UserIcon,
  Search,
  Eye,
  X,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import type { AdminReview, ModerationStatus } from "@/lib/reviews";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | ModerationStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
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

  const handleUpdateStatus = async (id: string, newStatus: ModerationStatus) => {
    try {
      setActionLoadingId(id);
      const res = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
        if (selectedReview?.id === id) {
          setSelectedReview((prev) => (prev ? { ...prev, ...updated } : null));
        }
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update review status.");
      }
    } catch (error) {
      console.error("Error updating review status:", error);
      alert("An unexpected error occurred.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        if (selectedReview?.id === id) {
          setSelectedReview(null);
        }
        setDeleteConfirmId(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete review.");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Status counts for navigation badges
  const counts = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.moderationStatus === "PENDING").length;
    const approved = reviews.filter((r) => r.moderationStatus === "APPROVED").length;
    const rejected = reviews.filter((r) => r.moderationStatus === "REJECTED").length;
    return { total, pending, approved, rejected };
  }, [reviews]);

  // Filtered reviews based on active tab and search query
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      // Tab filter
      if (activeTab !== "ALL" && review.moderationStatus !== activeTab) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = review.displayName?.toLowerCase().includes(query);
        const matchesText = review.reviewText?.toLowerCase().includes(query);
        const matchesProduct = review.product?.name?.toLowerCase().includes(query);
        const matchesEmail = review.user?.email?.toLowerCase().includes(query);
        return Boolean(matchesName || matchesText || matchesProduct || matchesEmail);
      }
      return true;
    });
  }, [reviews, activeTab, searchQuery]);

  const renderStatusBadge = (status: ModerationStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} className="text-emerald-600" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium tracking-wide bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} className="text-rose-600" />
            Rejected
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium tracking-wide bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock size={12} className="text-amber-600" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-brand-dark">Review Moderation</h1>
          <p className="font-mono text-xs text-brand-gray-500 mt-1 uppercase tracking-wider">
            Phase 4: Customer Feedback & Photo Moderation
          </p>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
              activeTab === "ALL"
                ? "bg-brand-navy text-white shadow-sm"
                : "bg-white text-brand-gray-600 hover:bg-brand-gray-50 border border-brand-gray-200"
            }`}
          >
            All Reviews ({counts.total})
          </button>
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === "PENDING"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-amber-800 hover:bg-amber-50 border border-amber-200"
            }`}
          >
            Pending ({counts.pending})
            {counts.pending > 0 && (
              <span className={`w-2 h-2 rounded-full ${activeTab === "PENDING" ? "bg-white" : "bg-amber-500"}`} />
            )}
          </button>
          <button
            onClick={() => setActiveTab("APPROVED")}
            className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
              activeTab === "APPROVED"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
            }`}
          >
            Approved ({counts.approved})
          </button>
          <button
            onClick={() => setActiveTab("REJECTED")}
            className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
              activeTab === "REJECTED"
                ? "bg-rose-700 text-white shadow-sm"
                : "bg-white text-rose-800 hover:bg-rose-50 border border-rose-200"
            }`}
          >
            Rejected ({counts.rejected})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, product, text..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-brand-gray-200 rounded-lg bg-white focus:outline-none focus:border-brand-navy"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray-400 hover:text-brand-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Reviews Table */}
      <div className="bg-white rounded-xl shadow-sm border border-brand-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-brand-gray-400 font-mono text-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-gray-300 border-t-brand-navy mb-4" />
            <p>Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-16 text-center text-brand-gray-400 font-mono text-sm">
            {searchQuery
              ? `No reviews match "${searchQuery}".`
              : activeTab === "PENDING"
              ? "All caught up! No pending reviews awaiting moderation."
              : `No ${activeTab.toLowerCase()} reviews found.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-gray-200 bg-brand-gray-50/70 font-mono text-xs uppercase tracking-wider text-brand-gray-500">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Rating & Review</th>
                  <th className="p-4 text-center">Photos</th>
                  <th className="p-4 w-32">Status</th>
                  <th className="p-4 w-52 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-100">
                {filteredReviews.map((review) => {
                  const isActing = actionLoadingId === review.id;
                  return (
                    <tr
                      key={review.id}
                      className="hover:bg-brand-gray-50/50 transition-colors group"
                    >
                      {/* Customer Info */}
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-3">
                          {review.customerPhotoUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewPhoto({
                                  url: review.customerPhotoUrl!,
                                  title: `${review.displayName}'s Photo`,
                                })
                              }
                              className="relative w-10 h-10 rounded-full overflow-hidden border border-brand-gray-200 shrink-0 hover:ring-2 hover:ring-brand-blue"
                            >
                              <Image
                                src={review.customerPhotoUrl}
                                alt={review.displayName}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </button>
                          ) : review.user?.image ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-brand-gray-200 shrink-0">
                              <Image
                                src={review.user.image}
                                alt={review.displayName}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-brand-gray-100 border border-brand-gray-200 flex items-center justify-center text-brand-gray-500 font-mono text-xs font-semibold shrink-0">
                              {review.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-brand-black text-sm">{review.displayName}</div>
                            {review.user?.email && (
                              <div className="text-xs text-brand-gray-400 font-mono truncate max-w-[140px]" title={review.user.email}>
                                {review.user.email}
                              </div>
                            )}
                            <div className="text-xs text-brand-gray-400 font-mono mt-0.5">
                              {format(new Date(review.createdAt), "MMM d, yyyy")}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Product Info */}
                      <td className="p-4 align-top">
                        {review.product ? (
                          <Link
                            href={`/product/${review.product.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-brand-dark hover:text-brand-blue hover:underline text-sm font-medium"
                          >
                            <span className="line-clamp-2 max-w-[180px]">{review.product.name}</span>
                            <ExternalLink size={12} className="text-brand-gray-400 shrink-0" />
                          </Link>
                        ) : (
                          <span className="text-brand-gray-400 text-xs font-mono">Unknown Product</span>
                        )}
                      </td>

                      {/* Rating & Review Text */}
                      <td className="p-4 align-top max-w-sm">
                        <div className="flex items-center gap-1 text-amber-500 text-sm mb-1">
                          {"★".repeat(review.rating)}
                          <span className="text-brand-gray-300">{"★".repeat(5 - review.rating)}</span>
                          <span className="font-mono text-xs text-brand-gray-500 ml-1.5">({review.rating}/5)</span>
                        </div>
                        <p className="text-sm text-brand-gray-600 line-clamp-3 leading-relaxed">
                          {review.reviewText}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedReview(review)}
                          className="mt-1 text-xs font-mono text-brand-blue hover:underline inline-flex items-center gap-1"
                        >
                          <Eye size={12} /> View Details
                        </button>
                      </td>

                      {/* Attached Photos */}
                      <td className="p-4 align-top text-center">
                        <div className="flex items-center justify-center gap-2">
                          {review.customerPhotoUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewPhoto({
                                  url: review.customerPhotoUrl!,
                                  title: `${review.displayName}'s Customer Photo`,
                                })
                              }
                              className="relative w-9 h-9 rounded-lg border border-brand-gray-200 overflow-hidden hover:ring-2 hover:ring-brand-blue group/img"
                              title="Customer Photo"
                            >
                              <Image
                                src={review.customerPhotoUrl}
                                alt="Customer"
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </button>
                          ) : null}

                          {review.productPhotoUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewPhoto({
                                  url: review.productPhotoUrl!,
                                  title: `Product Review Photo for ${review.product?.name || "Product"}`,
                                })
                              }
                              className="relative w-9 h-9 rounded-lg border border-brand-gray-200 overflow-hidden hover:ring-2 hover:ring-brand-blue group/img"
                              title="Product Photo"
                            >
                              <Image
                                src={review.productPhotoUrl}
                                alt="Product Review"
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </button>
                          ) : null}

                          {!review.customerPhotoUrl && !review.productPhotoUrl && (
                            <span className="text-xs font-mono text-brand-gray-300">—</span>
                          )}
                        </div>
                      </td>

                      {/* Moderation Status */}
                      <td className="p-4 align-top">
                        {renderStatusBadge(review.moderationStatus)}
                      </td>

                      {/* Moderation Action Buttons */}
                      <td className="p-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {review.moderationStatus !== "APPROVED" && (
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleUpdateStatus(review.id, "APPROVED")}
                              className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 inline-flex items-center gap-1 shadow-xs"
                              title="Approve Review"
                            >
                              <CheckCircle size={12} />
                              Approve
                            </button>
                          )}

                          {review.moderationStatus !== "REJECTED" && (
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleUpdateStatus(review.id, "REJECTED")}
                              className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                              title="Reject Review"
                            >
                              <XCircle size={12} />
                              Reject
                            </button>
                          )}

                          {review.moderationStatus !== "PENDING" && (
                            <button
                              type="button"
                              disabled={isActing}
                              onClick={() => handleUpdateStatus(review.id, "PENDING")}
                              className="px-2 py-1 text-xs font-mono uppercase tracking-wider rounded-md bg-brand-gray-100 text-brand-gray-600 hover:bg-brand-gray-200 transition-colors disabled:opacity-50"
                              title="Reset to Pending"
                            >
                              Pending
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => setDeleteConfirmId(review.id)}
                            className="p-1.5 text-brand-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                            title="Delete Review"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Details Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-xl border border-brand-gray-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedReview(null)}
              className="absolute top-6 right-6 text-brand-gray-400 hover:text-brand-dark p-1 rounded-lg"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-serif text-2xl text-brand-dark">Review Details</h2>
              {renderStatusBadge(selectedReview.moderationStatus)}
            </div>

            <div className="space-y-6">
              {/* Product Info */}
              <div className="p-4 bg-brand-gray-50 rounded-xl border border-brand-gray-200/60">
                <span className="font-mono text-xs text-brand-gray-400 uppercase tracking-widest block mb-1">
                  Product
                </span>
                {selectedReview.product ? (
                  <Link
                    href={`/product/${selectedReview.product.slug}`}
                    target="_blank"
                    className="text-brand-dark font-medium hover:text-brand-blue hover:underline inline-flex items-center gap-1.5"
                  >
                    {selectedReview.product.name}
                    <ExternalLink size={14} className="text-brand-gray-400" />
                  </Link>
                ) : (
                  <span className="text-brand-gray-400">Unknown Product</span>
                )}
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-brand-gray-50 rounded-xl border border-brand-gray-200/60">
                  <span className="font-mono text-xs text-brand-gray-400 uppercase tracking-widest block mb-1">
                    Customer Name
                  </span>
                  <p className="text-brand-dark font-medium">{selectedReview.displayName}</p>
                </div>
                <div className="p-4 bg-brand-gray-50 rounded-xl border border-brand-gray-200/60">
                  <span className="font-mono text-xs text-brand-gray-400 uppercase tracking-widest block mb-1">
                    Submitted Date
                  </span>
                  <p className="text-brand-dark font-mono text-sm">
                    {format(new Date(selectedReview.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>

              {/* Rating & Review */}
              <div>
                <span className="font-mono text-xs text-brand-gray-400 uppercase tracking-widest block mb-1">
                  Rating
                </span>
                <div className="flex items-center gap-1 text-amber-500 text-xl mb-3">
                  {"★".repeat(selectedReview.rating)}
                  <span className="text-brand-gray-300">{"★".repeat(5 - selectedReview.rating)}</span>
                  <span className="font-mono text-sm text-brand-gray-500 ml-2">
                    {selectedReview.rating} out of 5 stars
                  </span>
                </div>
                <span className="font-mono text-xs text-brand-gray-400 uppercase tracking-widest block mb-1">
                  Review Text
                </span>
                <div className="p-4 bg-brand-gray-50 rounded-xl border border-brand-gray-200/60 text-brand-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                  {selectedReview.reviewText}
                </div>
              </div>

              {/* Attached Photos */}
              {(selectedReview.customerPhotoUrl || selectedReview.productPhotoUrl) && (
                <div>
                  <span className="font-mono text-xs text-brand-gray-400 uppercase tracking-widest block mb-3">
                    Attached Photos
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedReview.customerPhotoUrl && (
                      <div className="border border-brand-gray-200 rounded-xl p-3 bg-white">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-brand-gray-500 mb-2">
                          <UserIcon size={13} />
                          Customer Photo
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewPhoto({
                              url: selectedReview.customerPhotoUrl!,
                              title: `${selectedReview.displayName}'s Customer Photo`,
                            })
                          }
                          className="relative w-full h-44 rounded-lg overflow-hidden border border-brand-gray-100 hover:opacity-95"
                        >
                          <Image
                            src={selectedReview.customerPhotoUrl}
                            alt="Customer"
                            fill
                            sizes="(max-width: 640px) 100vw, 300px"
                            className="object-cover"
                          />
                        </button>
                      </div>
                    )}

                    {selectedReview.productPhotoUrl && (
                      <div className="border border-brand-gray-200 rounded-xl p-3 bg-white">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-brand-gray-500 mb-2">
                          <ImageIcon size={13} />
                          Product Photo
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewPhoto({
                              url: selectedReview.productPhotoUrl!,
                              title: "Product Photo",
                            })
                          }
                          className="relative w-full h-44 rounded-lg overflow-hidden border border-brand-gray-100 hover:opacity-95"
                        >
                          <Image
                            src={selectedReview.productPhotoUrl}
                            alt="Product Review"
                            fill
                            sizes="(max-width: 640px) 100vw, 300px"
                            className="object-cover"
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons in Modal */}
              <div className="pt-6 border-t border-brand-gray-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(selectedReview.id)}
                  className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-rose-600 hover:bg-rose-50 border border-rose-200 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 size={14} /> Delete Review
                </button>

                <div className="flex items-center gap-2">
                  {selectedReview.moderationStatus !== "APPROVED" && (
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedReview.id}
                      onClick={() => handleUpdateStatus(selectedReview.id, "APPROVED")}
                      className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                  )}
                  {selectedReview.moderationStatus !== "REJECTED" && (
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedReview.id}
                      onClick={() => handleUpdateStatus(selectedReview.id, "REJECTED")}
                      className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  )}
                  {selectedReview.moderationStatus !== "PENDING" && (
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedReview.id}
                      onClick={() => handleUpdateStatus(selectedReview.id, "PENDING")}
                      className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-brand-gray-100 hover:bg-brand-gray-200 text-brand-gray-700 transition-colors"
                    >
                      Set Pending
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-brand-gray-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle size={24} />
              <h3 className="font-serif text-xl font-bold text-brand-dark">Confirm Delete</h3>
            </div>
            <p className="text-sm text-brand-gray-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete this review? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-brand-gray-600 hover:bg-brand-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={actionLoadingId === deleteConfirmId}
                className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {actionLoadingId === deleteConfirmId ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center text-white mb-3 px-2">
              <span className="font-mono text-xs uppercase tracking-wider">{previewPhoto.title}</span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative w-full h-[65vh] rounded-xl overflow-hidden bg-black/50">
              <Image
                src={previewPhoto.url}
                alt={previewPhoto.title}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
