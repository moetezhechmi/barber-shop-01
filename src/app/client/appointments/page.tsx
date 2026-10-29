"use client";

import * as React from "react";
import { Calendar, Clock, User, Scissors, Star, X, CheckCircle, Loader2, MapPin } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { LoyaltyCard, LoyaltyCardSkeleton } from "@/components/ui/loyalty-card";
import { useLoyaltyStore } from "@/store/loyalty.store";
import { useSSEStore } from "@/store/sse.store";
import { formatDate, formatTime, getStatusLabel } from "@/lib/utils";

interface LoyaltyData {
  stamps: number;
  totalEarned: number;
  cardsCompleted: number;
}

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  shop: { id: string; name: string; address?: string };
  barber: { id: string; user: { name: string; image?: string } };
  service: { id: string; name: string; price: number };
  review?: { id: string } | null;
}

const TABS = [
  { value: "", label: "Tous" },
  { value: "upcoming", label: "À venir" },
  { value: "past", label: "Passés" },
];

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("");
  const [reviewModal, setReviewModal] = React.useState(false);
  const [reviewApt, setReviewApt] = React.useState<Appointment | null>(null);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [cancelling, setCancelling] = React.useState<string | null>(null);
  const { stamps, totalEarned, cardsCompleted, goal, loading: loyaltyLoading, fetchLoyalty } = useLoyaltyStore();
  const loyalty = { stamps, totalEarned, cardsCompleted };
  const { addListener } = useSSEStore();

  const fetch = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.fetch("/api/appointments");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetch(); }, [fetch]);
  React.useEffect(() => { fetchLoyalty(); }, [fetchLoyalty]);

  // Real-time: refresh when any appointment status changes
  React.useEffect(() => {
    const remove = addListener((event) => {
      if (event.type === "appointment_updated") {
        // Update status in-place without full reload
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === event.appointmentId ? { ...a, status: event.status } : a
          )
        );
      }
    });
    return remove;
  }, [addListener]);

  const filtered = React.useMemo(() => {
    const now = new Date();
    if (tab === "upcoming") return appointments.filter(a => new Date(a.date) >= now && a.status !== "CANCELLED");
    if (tab === "past") return appointments.filter(a => new Date(a.date) < now || a.status === "COMPLETED" || a.status === "CANCELLED");
    return appointments;
  }, [appointments, tab]);

  const cancel = async (id: string) => {
    setCancelling(id);
    try {
      const res = await window.fetch(`/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error();
      toast("Rendez-vous annulÃ©", "success");
      fetch();
    } catch {
      toast("Erreur", "error");
    } finally {
      setCancelling(null);
    }
  };

  const submitReview = async () => {
    if (!reviewApt || rating === 0) { toast("Donnez une note", "error"); return; }
    setSubmitting(true);
    try {
      const res = await window.fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: reviewApt.id,
          shopId: reviewApt.shop.id,
          barberId: reviewApt.barber.id,
          rating,
          comment,
        }),
      });
      if (!res.ok) throw new Error();
      toast("Merci !", "success");
      setReviewModal(false);
      setRating(0);
      setComment("");
      fetch();
    } catch {
      toast("Erreur", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openReview = (apt: Appointment) => {
    setReviewApt(apt);
    setRating(0);
    setComment("");
    setReviewModal(true);
  };

  if (loading) return (
    <Spinner fullPage label="Chargement de vos rendez-vous..." />
  );

  return (
    <div className="min-h-dvh bg-gray-50 pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-white mb-1">Mes rendez-vous</h1>
              <p className="text-violet-100 text-sm">
                {filtered.length > 0
                  ? `${filtered.length} rendez-vous ${tab === "upcoming" ? "à venir" : tab === "past" ? "passés" : "au total"}`
                  : "Aucun rendez-vous"}
              </p>
            </div>
            {loyalty && loyalty.cardsCompleted > 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white/20 border border-white/30 px-3 py-2 shrink-0">
                <span className="text-2xl font-black text-white leading-none">{loyalty.cardsCompleted}</span>
                <span className="text-[10px] font-semibold text-violet-200 uppercase tracking-wide mt-0.5">
                  {loyalty.cardsCompleted > 1 ? "cartes" : "carte"}
                </span>
                <span className="text-[10px] text-violet-300">complétée{loyalty.cardsCompleted > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
                    {/* Loyalty card */}
          <div className="mt-5">
            {loyaltyLoading ? (
              <LoyaltyCardSkeleton />
            ) : loyalty ? (
              <LoyaltyCard
                stamps={stamps}
                goal={goal}
                totalEarned={totalEarned}
                cardsCompleted={cardsCompleted}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          {TABS.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                tab === t.value ? "bg-violet-600 text-white shadow-sm" : "text-gray-400"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 max-w-lg mx-auto space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-900">Aucun rendez-vous</p>
            <p className="text-xs text-gray-400 mt-1">RÃ©servez votre prochaine coupe !</p>
          </div>
        ) : (
          filtered.map(apt => {
            const past = new Date(apt.date) < new Date() || apt.status === "COMPLETED";
            const canCancel = apt.status === "PENDING" || apt.status === "CONFIRMED";
            const canReview = apt.status === "COMPLETED" && !apt.review;
            
            return (
              <div key={apt.id} className="bg-white rounded-2xl p-4 shadow-sm">
                {/* Status badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{apt.shop.name}</h3>
                    <p className="text-xs text-gray-400 truncate">{apt.shop.address || "â€”"}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold ${
                    apt.status === "CONFIRMED" ? "bg-blue-50 text-blue-600" :
                    apt.status === "COMPLETED" ? "bg-green-50 text-green-600" :
                    apt.status === "CANCELLED" ? "bg-red-50 text-red-500" :
                    "bg-amber-50 text-amber-600"
                  }`}>
                    {getStatusLabel(apt.status)}
                  </span>
                </div>

                {/* Service + Barber */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <Scissors className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{apt.service.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                      {apt.barber.user.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={apt.barber.user.image} alt="" className="h-3.5 w-3.5 rounded-full" />
                        : <User className="h-3.5 w-3.5" />}
                      {apt.barber.user.name}
                    </p>
                  </div>
                  <p className="font-black text-sm text-violet-600 shrink-0">{apt.service.price.toFixed(2)} DT</p>
                </div>

                {/* Date + Time */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700">{formatDate(apt.date)}</span>
                  </div>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="flex items-center gap-2 flex-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700">{formatTime(apt.startTime)}</span>
                  </div>
                </div>

                {/* Notes */}
                {apt.notes && (
                  <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 mb-3">
                    <p className="text-xs text-violet-700 italic">"{apt.notes}"</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {canCancel && (
                    <button onClick={() => cancel(apt.id)} disabled={cancelling === apt.id}
                      className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-500 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-1.5">
                      {cancelling === apt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                      Annuler
                    </button>
                  )}
                  {canReview && (
                    <button onClick={() => openReview(apt)}
                      className="flex-1 rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-white active:scale-95 transition-transform flex items-center justify-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-white" />
                      Donner mon avis
                    </button>
                  )}
                  {apt.review && (
                    <div className="flex-1 rounded-xl bg-green-50 border border-green-100 py-2.5 text-xs font-bold text-green-600 flex items-center justify-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Avis publiÃ©
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="Donner mon avis">
        <div className="space-y-5">
          {reviewApt && (
            <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
              <p className="font-bold text-gray-900 text-sm">{reviewApt.shop.name}</p>
              <p className="text-xs text-gray-500 mt-1">{reviewApt.service.name} Â· {reviewApt.barber.user.name}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-gray-500 mb-3">Note</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)}
                  className="active:scale-125 transition-transform">
                  <Star className={`h-9 w-9 transition-colors ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">Commentaire (optionnel)</p>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none resize-none"
              placeholder="Votre expÃ©rience..." />
          </div>

          <button onClick={submitReview} disabled={submitting || rating === 0}
            className="w-full rounded-2xl bg-violet-600 py-4 text-sm font-black text-white active:scale-[0.99] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Star className="h-5 w-5" />}
            {submitting ? "Envoi..." : "Publier"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
