"use client";

import * as React from "react";
import { Calendar, Clock, User, Scissors, Star, MessageSquare, X, CheckCircle, Loader2, MapPin, ListFilter, Clock3, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatTime, getStatusColor, getStatusLabel } from "@/lib/utils";

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  shop: { id: string; name: string; address?: string };
  barber: { id: string; user: { name: string } };
  service: { id: string; name: string; price: number };
  review?: { id: string } | null;
}

const STATUS_FILTERS = [
  { value: "", label: "Tous", icon: ListFilter },
  { value: "PENDING", label: "En attente", icon: Clock3 },
  { value: "CONFIRMED", label: "Confirmés", icon: Calendar },
  { value: "COMPLETED", label: "Terminés", icon: CheckCircle },
  { value: "CANCELLED", label: "Annulés", icon: Ban },
];

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState("");
  const [reviewModal, setReviewModal] = React.useState(false);
  const [reviewAppointment, setReviewAppointment] = React.useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = React.useState(0);
  const [reviewComment, setReviewComment] = React.useState("");
  const [reviewSubmitting, setReviewSubmitting] = React.useState(false);
  const [cancelling, setCancelling] = React.useState<string | null>(null);

  const fetchAppointments = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter ? `/api/appointments?status=${statusFilter}` : "/api/appointments";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Impossible de charger les rendez-vous");
      const data = await res.json();
      setAppointments(Array.isArray(data.appointments) ? data.appointments : Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error("Impossible d'annuler");
      toast("Rendez-vous annulé", "success");
      fetchAppointments();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setCancelling(null);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewAppointment || reviewRating === 0) {
      toast("Veuillez donner une note", "error");
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: reviewAppointment.id,
          shopId: reviewAppointment.shop.id,
          barberId: reviewAppointment.barber.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (!res.ok) throw new Error("Impossible d'envoyer l'avis");
      toast("Merci pour votre avis !", "success");
      setReviewModal(false);
      setReviewRating(0);
      setReviewComment("");
      fetchAppointments();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const openReview = (apt: Appointment) => {
    setReviewAppointment(apt);
    setReviewRating(0);
    setReviewComment("");
    setReviewModal(true);
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
            Mes rendez-vous
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Gérez vos réservations passées et à venir
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap gap-3 hide-scrollbar">
        {STATUS_FILTERS.map((f) => {
          const isActive = statusFilter === f.value;
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`relative flex items-center gap-2 whitespace-nowrap shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 overflow-hidden ${
                isActive
                  ? "text-white shadow-[0_8px_20px_-6px_rgba(139,92,246,0.5)] scale-105"
                  : "bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md text-neutral-600 dark:text-neutral-400 border border-neutral-200/50 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800 hover:scale-105 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 animate-fade-in" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {Icon && <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white"}`} />}
                {f.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-pulse">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl border-4 border-violet-200 dark:border-violet-900 border-t-violet-600 dark:border-t-violet-400 animate-spin" />
            <Calendar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-violet-600 dark:text-violet-400 opacity-50" />
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">Chargement de vos rendez-vous...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && appointments.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-xl">
          <div className="h-20 w-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-6">
            <Calendar className="h-10 w-10 text-violet-500 dark:text-violet-400" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Aucun rendez-vous
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
            {statusFilter 
              ? "Vous n'avez aucun rendez-vous correspondant à ce statut." 
              : "Vous n'avez pas encore de rendez-vous. Réservez votre prochaine coupe dès maintenant !"}
          </p>
        </div>
      )}

      {/* Appointments Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {appointments.map((apt, index) => {
          const statusColors: Record<string, string> = {
            COMPLETED: "from-green-500 to-emerald-600",
            CONFIRMED: "from-blue-500 to-indigo-600",
            CANCELLED: "from-red-500 to-rose-600",
            PENDING: "from-amber-500 to-orange-600",
          };
          const bgGradient = statusColors[apt.status] || "from-violet-500 to-purple-600";

          return (
            <div
              key={apt.id}
              className="group relative overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.2)] animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Status Indicator Line */}
              <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${bgGradient}`} />

              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">
                      {apt.shop.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400">
                      <Scissors className="h-4 w-4" />
                      {apt.service.name}
                    </div>
                  </div>
                  <div className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md bg-gradient-to-r ${bgGradient}`}>
                    {getStatusLabel(apt.status)}
                  </div>
                </div>

                <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-300">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="flex items-center gap-3 flex-1 border-r border-neutral-200 dark:border-neutral-700">
                      <Calendar className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                      <span className="font-semibold">{formatDate(apt.date)}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 pl-2">
                      <Clock className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                      <span className="font-semibold">{formatTime(apt.startTime)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-2">
                    <User className="h-5 w-5 text-neutral-400" />
                    <span>Barbier : <span className="font-medium text-neutral-900 dark:text-white">{apt.barber?.user?.name || "—"}</span></span>
                  </div>

                  {apt.notes && (
                    <div className="flex items-start gap-3 px-2">
                      <MessageSquare className="h-5 w-5 text-neutral-400 shrink-0 mt-0.5" />
                      <span className="italic bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl flex-1">{apt.notes}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-wrap gap-3">
                  {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                    <button
                      onClick={() => handleCancel(apt.id)}
                      disabled={cancelling === apt.id}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelling === apt.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Annuler
                    </button>
                  )}
                  {apt.status === "COMPLETED" && !apt.review && (
                    <button
                      onClick={() => openReview(apt)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-yellow-500/20 transition-transform hover:scale-[1.02]"
                    >
                      <Star className="h-4 w-4 fill-white" />
                      Donner mon avis
                    </button>
                  )}
                  {apt.status === "COMPLETED" && apt.review && (
                    <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/50">
                      <CheckCircle className="h-5 w-5" />
                      Avis publié avec succès
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="Donner mon avis">
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-5 border border-violet-100 dark:border-violet-900/30">
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-1">
              {reviewAppointment?.shop.name}
            </p>
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <User className="h-4 w-4" />
              <span>{reviewAppointment?.barber.user.name}</span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <Scissors className="h-4 w-4" />
              <span>{reviewAppointment?.service.name}</span>
            </div>
          </div>

          <div>
            <label className="mb-4 block text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Quelle est votre note ?
            </label>
            <div className="flex gap-2 justify-center py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="transition-all duration-200 hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`h-10 w-10 transition-colors duration-300 ${
                      star <= reviewRating
                        ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                        : "text-neutral-200 dark:text-neutral-700"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Votre commentaire <span className="text-neutral-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              className="flex w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-all resize-none"
              placeholder="Comment s'est passée votre coupe ?"
            />
          </div>

          <button
            onClick={handleReviewSubmit}
            disabled={reviewSubmitting || reviewRating === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {reviewSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Star className="h-5 w-5 fill-white/20" />
            )}
            {reviewSubmitting ? "Envoi en cours..." : "Publier mon avis"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
