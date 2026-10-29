"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Star, MapPin, Phone, Scissors, Clock, CheckCircle,
  ArrowLeft, Sparkles, Loader2, X, CalendarDays,
  Wifi, Coffee, Gamepad, Snowflake, Car, ChevronDown, ChevronUp,
  Tag, ShieldCheck, Share2, Check, Info, Award, User
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";

/* ── social SVGs ── */
const IgIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="3"/>
  </svg>
);
const FbIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.95z"/>
  </svg>
);
const TkIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12.525.02c1.31-.03 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.21-.42-.45-.61-.7-.02 3.68-.01 7.36-.02 11.04-.1 1.72-.77 3.47-2.07 4.59-1.27 1.14-3.03 1.75-4.74 1.78-1.72.03-3.51-.48-4.82-1.57-1.37-1.12-2.18-2.91-2.29-4.67-.16-2.52 1.34-5.01 3.73-5.87.5-.18 1.04-.3 1.57-.36v4.13c-.4.07-.82.19-1.19.4-.87.49-1.34 1.53-1.13 2.53.16.82.81 1.48 1.62 1.64.97.21 2.05-.18 2.52-1.07.22-.4.29-.87.28-1.32-.01-4.08 0-8.15-.01-12.23.01-.15.01-.3 0-.45z"/>
  </svg>
);

const AMENITIES = [
  { key: "wifi", label: "Wi-Fi Gratuit", icon: Wifi },
  { key: "coffee", label: "Café Offert", icon: Coffee },
  { key: "playstation", label: "PS5 Lounge", icon: Gamepad },
  { key: "ac", label: "Climatisation", icon: Snowflake },
  { key: "parking", label: "Parking Facile", icon: Car },
];

interface GalleryImage { id: string; url: string; caption: string | null; }
interface Barber { id: string; user: { id: string; name: string; image?: string }; bio?: string; reviews?: { rating: number }[]; gallery?: GalleryImage[]; }
interface Service { id: string; name: string; description?: string; duration: number; price: number; }
interface Shop {
  id: string; name: string; address: string; phone: string | null; description: string | null;
  images?: string[]; amenities?: string[]; facebook?: string | null; instagram?: string | null; tiktok?: string | null;
  barbers: Barber[]; services: Service[];
}

function safeFormatDate(dStr: string) {
  if (!dStr) return "";
  const clean = dStr.split("T")[0];
  try {
    return formatDate(clean);
  } catch {
    return clean;
  }
}

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [shop, setShop] = React.useState<Shop | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reviews, setReviews] = React.useState<any[]>([]);

  const [booking, setBooking] = React.useState({ service: "", barber: "", date: "", time: "", assignedBarberId: "", notes: "" });
  const [slots, setSlots] = React.useState<{ time: string; barberId: string }[]>([]);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  const [showSheet, setShowSheet] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState<any>(null);
  const [activeBarber, setActiveBarber] = React.useState<Barber | null>(null);
  const [heroIdx, setHeroIdx] = React.useState(0);
  const [showGallery, setShowGallery] = React.useState(false);
  const [tab, setTab] = React.useState<"book" | "team" | "reviews">("book");
  const [showDesc, setShowDesc] = React.useState(false);
  const [calMonth, setCalMonth] = React.useState(new Date().getMonth());
  const [calYear, setCalYear] = React.useState(new Date().getFullYear());
  const [isFreeReady, setIsFreeReady] = React.useState(false);

  const tx0 = React.useRef(0);
  const tabsRef = React.useRef<HTMLDivElement>(null);

  // Promotion States
  const [isPromo, setIsPromo] = React.useState(false);
  const [promoStart, setPromoStart] = React.useState("");
  const [promoEnd, setPromoEnd] = React.useState("");
  const [promoDiscount, setPromoDiscount] = React.useState("");
  const [activePromoTitle, setActivePromoTitle] = React.useState("");
  const [promotions, setPromotions] = React.useState<any[]>([]);

  // Compute today's date in local YYYY-MM-DD
  const todayStr = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Handle URL query parameters (e.g. from notifications or promotional links)
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("promo") === "true") {
      setIsPromo(true);
      const start = (sp.get("startDate") || "").split("T")[0];
      const end = (sp.get("endDate") || "").split("T")[0];
      const disc = sp.get("discount") || "";
      const title = sp.get("title") || "";
      setPromoStart(start);
      setPromoEnd(end);
      setPromoDiscount(disc);
      if (title) setActivePromoTitle(title);
      setTab("book");
      if (start) {
        const parts = start.split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          if (!isNaN(y) && !isNaN(m)) {
            setCalYear(y);
            setCalMonth(m);
          }
        }
      }
      setTimeout(() => {
        tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, []);

  // Fetch shop data, reviews, and promotions
  React.useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/shops/${params.id}`).then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`/api/reviews?shopId=${params.id}`).then(r => r.ok ? r.json() : { reviews: [] }),
      fetch(`/api/shops/${params.id}/promotions`).then(r => r.ok ? r.json() : { promotions: [] }),
      fetch("/api/loyalty").then(r => r.ok ? r.json() : { isFreeReady: false }),
    ]).then(([sd, rd, pd, ld]) => { 
      setShop(sd.shop ?? sd); 
      setReviews(rd.reviews || []); 
      setPromotions(pd.promotions || []);
      setIsFreeReady(ld.isFreeReady === true);
    })
      .catch(() => setError("Impossible de charger le salon"))
      .finally(() => setLoading(false));
  }, [params.id]);

  // Load barber availability slots when barber & date are chosen
  React.useEffect(() => {
    if (!booking.barber || !booking.date || !shop) { setSlots([]); return; }
    setSlotsLoading(true);
    (async () => {
      try {
        if (booking.barber === "any") {
          const res = await Promise.all(
            shop.barbers.map(b =>
              fetch(`/api/barbers/${b.id}/availability?date=${booking.date}`)
                .then(r => r.ok ? r.json() : { slots: [] })
                .then(d => ({ id: b.id, slots: Array.isArray(d.slots) ? d.slots : [] }))
            )
          );
          const seen = new Set<string>();
          const out: typeof slots = [];
          res.forEach(r => r.slots.forEach((t: string) => {
            if (!seen.has(t)) {
              seen.add(t);
              out.push({ time: t, barberId: r.id });
            }
          }));
          setSlots(out.sort((a, b) => a.time.localeCompare(b.time)));
        } else {
          const d = await fetch(`/api/barbers/${booking.barber}/availability?date=${booking.date}`).then(r => r.json());
          setSlots((Array.isArray(d.slots) ? d.slots : []).map((t: string) => ({ time: t, barberId: booking.barber })));
        }
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [booking.barber, booking.date, shop]);

  // Price calculations
  const svc = React.useMemo(() => shop?.services.find(s => s.id === booking.service), [shop, booking.service]);
  const origPrice = svc?.price ?? 0;
  const discountVal = Number(promoDiscount);
  const hasDiscount = isPromo && !isNaN(discountVal) && discountVal > 0;
  const finalPrice = isFreeReady ? 0 : hasDiscount ? origPrice * (1 - discountVal / 100) : origPrice;
  const shopRating = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 4.9;
  const imgs = shop?.images ?? [];
  const s1 = !!booking.service;
  const s2 = !!booking.barber;
  const s3 = !!booking.date && !!booking.time;
  const ready = s1 && s2 && s3;
  const getBRating = (b: Barber) => b.reviews?.length ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length : 4.9;

  // Filter valid promotions
  const displayPromotions = React.useMemo(() => {
    if (!promotions || promotions.length === 0) return [];
    const valid = promotions.filter(p => {
      if (p.isActive === false) return false;
      const end = (p.endDate || "").split("T")[0];
      return !end || end >= todayStr;
    });
    return valid.length > 0 ? valid : promotions.slice(0, 1);
  }, [promotions, todayStr]);

  // Handle clicking "Profiter"
  const handleApplyPromo = (promo: any) => {
    const discStr = (promo.discount ?? 20).toString();
    const startStr = (promo.startDate || "").split("T")[0];
    const endStr = (promo.endDate || "").split("T")[0];

    setIsPromo(true);
    setPromoDiscount(discStr);
    setPromoStart(startStr);
    setPromoEnd(endStr);
    setActivePromoTitle(promo.title || "");

    if (startStr) {
      const parts = startStr.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setCalYear(y);
          setCalMonth(m);
        }
      }
    }

    if (booking.date) {
      if ((startStr && booking.date < startStr) || (endStr && booking.date > endStr)) {
        setBooking(b => ({ ...b, date: "", time: "", assignedBarberId: "" }));
      }
    }

    setTab("book");

    setTimeout(() => {
      const el = tabsRef.current || document.getElementById("booking-tabs");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);

    toast(`Offre -${promo.discount}% appliquée ! Prestations à prix réduits.`, "success");
  };

  const handleRemovePromo = () => {
    setIsPromo(false);
    setPromoDiscount("");
    setPromoStart("");
    setPromoEnd("");
    setActivePromoTitle("");
    toast("Promotion retirée", "info");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shop?.name || "Barber Shop",
          text: `Découvrez ${shop?.name} sur BarberPro !`,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast("Lien du salon copié !", "success");
    }
  };

  const handleBook = async () => {
    if (!ready || !booking.assignedBarberId) {
      toast("Veuillez compléter toutes les étapes", "error");
      return;
    }
    setSubmitting(true);
    try {
      const noteWithPromo = isPromo && promoDiscount
        ? (booking.notes ? `${booking.notes} (Offre -${promoDiscount}%)` : `Offre promotionnelle -${promoDiscount}%`)
        : booking.notes;

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: booking.service,
          barberId: booking.assignedBarberId,
          shopId: shop!.id,
          date: booking.date,
          startTime: booking.time,
          notes: noteWithPromo,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erreur lors de la réservation");
      setConfirmation((await res.json()).appointment ?? {});
      toast("Rendez-vous confirmé avec succès !", "success");
      setShowSheet(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50">
        <Spinner size="lg" label="Chargement de votre salon..." />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center bg-gray-50 text-gray-900">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-2">
          <Scissors className="h-8 w-8" />
        </div>
        <p className="text-lg font-bold text-red-600">{error || "Salon introuvable"}</p>
        <button
          onClick={() => router.back()}
          className="rounded-2xl bg-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-300 transition-colors"
        >
          Retour aux salons
        </button>
      </div>
    );
  }

  if (confirmation) {
    const barber = shop.barbers.find(b => b.id === booking.assignedBarberId);
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-4 bg-gray-50 text-gray-900">
        <div className="w-full max-w-sm rounded-[32px] bg-white border border-gray-100 p-7 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-36 w-36 rounded-full bg-emerald-100/60 blur-2xl" />
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900">Réservation Confirmée !</h2>
          <p className="text-xs text-gray-500 mt-1">Votre créneau est enregistré avec succès au salon.</p>
          
          <div className="mt-6 space-y-3 rounded-2xl bg-gray-50 border border-gray-100 p-4 text-xs text-left">
            {[
              ["Salon", shop.name],
              ["Prestation", svc?.name || "—"],
              ["Barbier", barber?.user.name || "Premier disponible"],
              ["Date", safeFormatDate(booking.date)],
              ["Heure", formatTime(booking.time)],
              ["Prix", isFreeReady ? "0.00 DT (Offert 🎉)" : isPromo && promoDiscount ? `${formatPrice(finalPrice)} (-${promoDiscount}%)` : formatPrice(origPrice)]
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-0.5 border-b border-gray-200/40 last:border-none">
                <span className="text-gray-500 font-medium">{k}</span>
                <span className="font-bold text-gray-900">{v}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push("/client/appointments")}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 py-4 text-sm font-black text-white shadow-xl shadow-violet-500/25 active:scale-95 transition-all"
          >
            Voir mes rendez-vous
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50/70 text-gray-900 pb-[160px] antialiased selection:bg-violet-600 selection:text-white">

      {/* ── TOP IMMERSIVE HERO WITH GLASS CONTROLS ── */}
      <div 
        className="relative overflow-hidden w-full h-[320px] sm:h-[380px]"
        onTouchStart={e => { tx0.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          const diff = tx0.current - e.changedTouches[0].clientX;
          const len = imgs.length;
          if (Math.abs(diff) < 40 || len <= 1) return;
          setHeroIdx(p => diff > 0 ? (p < len-1 ? p+1 : 0) : (p > 0 ? p-1 : len-1));
        }}
      >
        {imgs.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgs[heroIdx]}
            alt={shop.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700" />
        )}

        {/* Ambient Dark-to-Light Gradients for readibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/40" />

        {/* Floating Top Nav Bar (Return + Share) */}
        <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-20">
          <button
            onClick={() => router.back()}
            className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white active:scale-90 hover:bg-white/30 transition-all shadow-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            onClick={handleShare}
            className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white active:scale-90 hover:bg-white/30 transition-all shadow-md"
            title="Partager"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {/* Image Count Pill */}
        {imgs.length > 1 && (
          <button
            onClick={() => setShowGallery(true)}
            className="absolute right-4 bottom-24 z-20 rounded-full bg-black/50 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] font-bold text-white flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Sparkles className="h-3 w-3 text-violet-300" />
            <span>{heroIdx + 1} / {imgs.length}</span>
          </button>
        )}

        {/* Slide Indicators */}
        {imgs.length > 1 && (
          <div className="absolute bottom-24 left-6 flex gap-1.5 z-20">
            {imgs.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === heroIdx ? "w-6 bg-white shadow-md" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Hero Title & Shop Status Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 z-20">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ouvert
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-violet-200 bg-white/15 border border-white/25 backdrop-blur-md">
                <Award className="h-3 w-3 text-amber-300" /> Salon Certifié
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              {shop.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-white/90">
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-violet-300 shrink-0" />
                <span className="truncate">{shop.address}</span>
              </p>
              {shopRating && (
                <div className="flex items-center gap-1 font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-black text-white">{shopRating.toFixed(1)}</span>
                  <span className="text-white/70">({reviews.length || 18} avis)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-2 space-y-4 relative z-20">

        {/* ── ACTION BADGES / SOCIAL BAR (LIGHT) ── */}
        <div className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
          <div className="flex items-center gap-2">
            {shop.phone ? (
              <a
                href={`tel:${shop.phone}`}
                className="flex items-center gap-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl px-3.5 py-2 text-xs font-bold border border-violet-100 transition-all active:scale-95"
              >
                <Phone className="h-3.5 w-3.5 text-violet-600" />
                <span>Appeler</span>
              </a>
            ) : (
              <span className="text-xs text-gray-500 px-2 font-medium">Salon BarberPro</span>
            )}
            <button
              onClick={() => {
                const el = document.getElementById("amenities-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl px-3 py-2 text-xs font-semibold border border-gray-200/60 transition-all"
            >
              <Info className="h-3.5 w-3.5 text-gray-500" />
              <span>Services</span>
            </button>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-1.5">
            {shop.instagram && (
              <a
                href={shop.instagram}
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-xl bg-gray-50 hover:bg-violet-600 hover:text-white text-gray-600 flex items-center justify-center transition-all border border-gray-200/60 active:scale-90"
              >
                <IgIcon />
              </a>
            )}
            {shop.facebook && (
              <a
                href={shop.facebook}
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-xl bg-gray-50 hover:bg-blue-600 hover:text-white text-gray-600 flex items-center justify-center transition-all border border-gray-200/60 active:scale-90"
              >
                <FbIcon />
              </a>
            )}
            {shop.tiktok && (
              <a
                href={shop.tiktok}
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-xl bg-gray-50 hover:bg-gray-800 hover:text-white text-gray-600 flex items-center justify-center transition-all border border-gray-200/60 active:scale-90"
              >
                <TkIcon />
              </a>
            )}
          </div>
        </div>

        {/* ── DESCRIPTION CARD (LIGHT) ── */}
        {shop.description && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className={`text-xs sm:text-sm text-gray-600 leading-relaxed ${showDesc ? "" : "line-clamp-2"}`}>
              {shop.description}
            </p>
            <button
              onClick={() => setShowDesc(p => !p)}
              className="flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700 mt-2 transition-colors cursor-pointer"
            >
              {showDesc ? (
                <><ChevronUp className="h-3 w-3" />Réduire</>
              ) : (
                <><ChevronDown className="h-3 w-3" />Lire plus</>
              )}
            </button>
          </div>
        )}

        {/* ── AMENITIES PILLS (LIGHT) ── */}
        {shop.amenities && shop.amenities.length > 0 && (
          <div id="amenities-section" className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {AMENITIES.filter(a => shop.amenities!.includes(a.key)).map(a => {
              const Icon = a.icon;
              return (
                <span
                  key={a.key}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 shrink-0 shadow-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-violet-600" />
                  {a.label}
                </span>
              );
            })}
          </div>
        )}

        {/* ── EXCLUSIVE PROMOTIONS BANNER ── */}
        {displayPromotions.length > 0 && (
          <div className="space-y-2">
            {displayPromotions.map(promo => {
              const isApplied = isPromo && promoDiscount === promo.discount.toString();
              return (
                <div
                  key={promo.id}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-500 p-4 text-white shadow-xl shadow-orange-500/20 border border-white/20"
                >
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 h-28 w-28 rounded-full bg-white/20 blur-xl pointer-events-none" />

                  <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/40 shadow-inner">
                        <span className="text-lg font-black tracking-tight">-{promo.discount}%</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-full">
                            Offre Flash
                          </span>
                          <span className="text-[10px] text-white/90">
                            {promo.endDate ? `Fin le ${safeFormatDate(promo.endDate)}` : "Limitée"}
                          </span>
                        </div>
                        <p className="font-black text-sm text-white tracking-tight truncate mt-0.5">
                          {promo.title}
                        </p>
                        {promo.description && (
                          <p className="text-[11px] text-white/90 line-clamp-1 mt-0.5">
                            {promo.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleApplyPromo(promo)}
                      className={`shrink-0 rounded-2xl px-4 py-2.5 text-xs font-black shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                        isApplied
                          ? "bg-emerald-500 text-white ring-2 ring-white/80"
                          : "bg-white text-orange-600 hover:bg-orange-50"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      {isApplied ? "Appliquée ✓" : "Profiter"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── MODERN TABS (LIGHT) ── */}
        <div
          ref={tabsRef}
          id="booking-tabs"
          className="sticky top-14 z-30 bg-white/90 backdrop-blur-xl border border-gray-200/80 rounded-2xl p-1.5 flex gap-1.5 shadow-md scroll-mt-20"
        >
          {(["book", "team", "reviews"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-xl py-3 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === t
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {t === "book" && <Scissors className="h-4 w-4" />}
              {t === "team" && <User className="h-4 w-4" />}
              {t === "reviews" && <Star className="h-4 w-4" />}
              {t === "book" ? "Réserver" : t === "team" ? "L'Équipe" : `Avis (${reviews.length})`}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="space-y-4">

          {/* ═══════════ TAB 1: RESERVATION FLOW ═══════════ */}
          {tab === "book" && (
            <div className="space-y-4">
              
              {/* Active Promotion Reminder Box */}
              {isPromo && promoDiscount && (
                <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-2xl p-3.5 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-red-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                      -{promoDiscount}%
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-red-900 truncate">
                        Remise de {promoDiscount}% activée !
                      </p>
                      <p className="text-[11px] text-red-700/80">
                        Les prix barrés s'appliquent automatiquement sur vos prestations.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="shrink-0 text-[11px] font-bold text-gray-500 hover:text-red-700 bg-white border border-gray-200 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Retirer
                  </button>
                </div>
              )}

              {/* STEP 1: SERVICES (LIGHT) */}
              <div className="rounded-3xl bg-white border border-gray-100 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      s1 ? "bg-emerald-500 text-white" : "bg-violet-600 text-white"
                    }`}>
                      {s1 ? <Check className="h-4 w-4" strokeWidth={3} /> : "1"}
                    </div>
                    <div>
                      <p className="font-black text-sm text-gray-900">Choisir une prestation</p>
                      <p className="text-[11px] text-gray-500">Sélectionnez la coupe ou le soin désiré</p>
                    </div>
                  </div>

                  {s1 && svc && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-violet-600 block truncate max-w-[120px]">{svc.name}</span>
                      <span className="text-xs font-black text-gray-900">{formatPrice(finalPrice)}</span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 space-y-2">
                  {shop.services.map(service => {
                    const isSelected = booking.service === service.id;
                    const calculatedPrice = hasDiscount ? service.price * (1 - discountVal / 100) : service.price;

                    return (
                      <button
                        key={service.id}
                        onClick={() => setBooking(b => ({ ...b, service: service.id }))}
                        className={`w-full flex items-center gap-3.5 rounded-2xl p-3.5 text-left transition-all active:scale-[0.99] cursor-pointer border ${
                          isSelected
                            ? "bg-violet-50/80 border-violet-500 shadow-sm"
                            : "bg-gray-50/70 hover:bg-gray-100 border-gray-100"
                        }`}
                      >
                        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "bg-violet-600 text-white shadow-md shadow-violet-200" : "bg-white text-gray-500 shadow-sm border border-gray-100"
                        }`}>
                          <Scissors className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${isSelected ? "text-violet-950 font-black" : "text-gray-900"}`}>
                            {service.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {service.duration} min
                            </span>
                            {service.description && (
                              <span className="truncate text-gray-400 text-[11px]">{service.description}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {hasDiscount ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] text-gray-400 line-through">
                                {formatPrice(service.price)}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-black text-red-600">
                                  {formatPrice(calculatedPrice)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className={`text-sm font-black ${isSelected ? "text-violet-600" : "text-gray-900"}`}>
                              {formatPrice(service.price)}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: BARBERS (LIGHT) */}
              <div className={`rounded-3xl bg-white border border-gray-100 overflow-hidden shadow-sm transition-opacity duration-300 ${
                s1 ? "opacity-100" : "opacity-35 pointer-events-none"
              }`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      s2 ? "bg-emerald-500 text-white" : s1 ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      {s2 ? <Check className="h-4 w-4" strokeWidth={3} /> : "2"}
                    </div>
                    <div>
                      <p className="font-black text-sm text-gray-900">Choisir un barbier</p>
                      <p className="text-[11px] text-gray-500">Sélectionnez votre professionnel préféré</p>
                    </div>
                  </div>

                  {s2 && (
                    <span className="text-xs font-bold text-violet-600">
                      {booking.barber === "any" ? "Premier disponible" : shop.barbers.find(b => b.id === booking.barber)?.user.name}
                    </span>
                  )}
                </div>

                <div className="flex gap-3 overflow-x-auto p-4 hide-scrollbar">
                  {/* First Available Pill */}
                  <button
                    onClick={() => setBooking(b => ({ ...b, barber: "any", time: "", assignedBarberId: "" }))}
                    className={`shrink-0 flex flex-col items-center gap-2 rounded-2xl w-28 py-4 px-2 transition-all active:scale-95 cursor-pointer border ${
                      booking.barber === "any"
                        ? "bg-violet-50 border-violet-500 shadow-sm"
                        : "bg-gray-50 hover:bg-gray-100 border-gray-100"
                    }`}
                  >
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-colors ${
                      booking.barber === "any" ? "bg-violet-600 text-white shadow-md shadow-violet-200" : "bg-white text-gray-400 shadow-sm border border-gray-100"
                    }`}>
                      <Sparkles className="h-6 w-6 text-amber-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-gray-900">Sans préférence</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Plus rapide</p>
                    </div>
                  </button>

                  {/* Barbers list */}
                  {shop.barbers.map(barber => {
                    const isSelected = booking.barber === barber.id;
                    const r = getBRating(barber);

                    return (
                      <button
                        key={barber.id}
                        onClick={() => setBooking(b => ({ ...b, barber: barber.id, time: "", assignedBarberId: "" }))}
                        className={`shrink-0 flex flex-col items-center gap-2 rounded-2xl w-28 py-4 px-2 transition-all active:scale-95 cursor-pointer border ${
                          isSelected
                            ? "bg-violet-50 border-violet-500 shadow-sm"
                            : "bg-gray-50 hover:bg-gray-100 border-gray-100"
                        }`}
                      >
                        <div className="relative">
                          {barber.user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={barber.user.image}
                              alt={barber.user.name}
                              className="h-14 w-14 rounded-2xl object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                              {barber.user.name[0]}
                            </div>
                          )}

                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        <div className="text-center w-full px-1">
                          <p className="text-xs font-black text-gray-900 truncate">{barber.user.name}</p>
                          {r && (
                            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-amber-500 mt-0.5">
                              <Star className="h-2.5 w-2.5 fill-amber-400" />
                              <span>{r.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: CALENDAR & TIME SLOTS (LIGHT) */}
              <div className={`rounded-3xl bg-white border border-gray-100 overflow-hidden shadow-sm transition-opacity duration-300 ${
                s2 ? "opacity-100" : "opacity-35 pointer-events-none"
              }`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      s3 ? "bg-emerald-500 text-white" : s2 ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      {s3 ? <Check className="h-4 w-4" strokeWidth={3} /> : "3"}
                    </div>
                    <div>
                      <p className="font-black text-sm text-gray-900">Date & Heure du créneau</p>
                      <p className="text-[11px] text-gray-500">Choisissez le moment idéal</p>
                    </div>
                  </div>

                  {s3 && (
                    <span className="text-xs font-bold text-violet-600">
                      {safeFormatDate(booking.date)} · {formatTime(booking.time)}
                    </span>
                  )}
                </div>

                <div className="p-4 sm:p-5 space-y-5">
                  {/* Calendar Widget */}
                  {(() => {
                    const now = new Date();
                    const yyyy = now.getFullYear();
                    const minDateStr = isPromo && promoStart ? (promoStart > todayStr ? promoStart : todayStr) : todayStr;
                    const maxDateStr = isPromo && promoEnd ? promoEnd : `${yyyy + (now.getMonth() >= 10 ? 1 : 0)}-${String(((now.getMonth() + 2) % 12) + 1).padStart(2, "0")}-28`;

                    const firstDay = new Date(calYear, calMonth, 1).getDay();
                    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                    const monthName = new Date(calYear, calMonth).toLocaleDateString("fr-FR", { month: "long" });

                    const viewMonthStart = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-01`;
                    const viewMonthEnd = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

                    const canPrev = viewMonthStart > minDateStr.slice(0, 7) + "-01";
                    const canNext = viewMonthEnd < maxDateStr;

                    const days: (number | null)[] = [
                      ...Array.from({ length: firstDay }, () => null),
                      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                    ];

                    return (
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={() => canPrev && setCalMonth(m => m === 0 ? (setCalYear(y => y - 1), 11) : m - 1)}
                            className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all ${
                              canPrev
                                ? "bg-white border-gray-200 text-gray-800 hover:bg-gray-100 active:scale-95 cursor-pointer shadow-sm"
                                : "border-gray-200 text-gray-300 cursor-not-allowed"
                            }`}
                            disabled={!canPrev}
                          >
                            ‹
                          </button>
                          <p className="font-black text-sm text-gray-900 capitalize tracking-wide">
                            {monthName} {calYear}
                          </p>
                          <button
                            onClick={() => canNext && setCalMonth(m => m === 11 ? (setCalYear(y => y + 1), 0) : m + 1)}
                            className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-all ${
                              canNext
                                ? "bg-white border-gray-200 text-gray-800 hover:bg-gray-100 active:scale-95 cursor-pointer shadow-sm"
                                : "border-gray-200 text-gray-300 cursor-not-allowed"
                            }`}
                            disabled={!canNext}
                          >
                            ›
                          </button>
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
                            <div key={i} className="h-7 flex items-center justify-center text-[11px] font-black text-gray-400">
                              {d}
                            </div>
                          ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {days.map((day, idx) => {
                            if (!day) return <div key={idx} />;
                            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const isPast = dateStr < todayStr;
                            const isBeforeMin = dateStr < minDateStr;
                            const isAfterMax = isPromo && promoEnd ? dateStr > promoEnd : false;
                            const disabled = isPast || isBeforeMin || isAfterMax;
                            const selected = booking.date === dateStr;

                            return (
                              <button
                                key={idx}
                                onClick={() => !disabled && setBooking(b => ({ ...b, date: dateStr, time: "", assignedBarberId: "" }))}
                                disabled={disabled}
                                className={`h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                                  selected
                                    ? "bg-violet-600 text-white shadow-md shadow-violet-200 scale-105"
                                    : disabled
                                      ? "text-gray-300 cursor-not-allowed"
                                      : "bg-white text-gray-800 hover:bg-violet-50 hover:text-violet-700 active:scale-95 cursor-pointer border border-gray-200/60 shadow-sm"
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Time Slots Section */}
                  {booking.date && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-violet-600" />
                          Créneaux disponibles ({safeFormatDate(booking.date)})
                        </p>
                      </div>

                      {slotsLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Spinner size="md" label="Vérification des disponibilités..." />
                        </div>
                      ) : slots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {slots.map((s, i) => {
                            const isSelected = booking.time === s.time;
                            return (
                              <button
                                key={`${s.time}-${i}`}
                                onClick={() => setBooking(b => ({ ...b, time: s.time, assignedBarberId: s.barberId }))}
                                className={`rounded-xl py-3 text-xs font-black transition-all active:scale-95 cursor-pointer border ${
                                  isSelected
                                    ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200 scale-105"
                                    : "bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200/60"
                                }`}
                              >
                                {formatTime(s.time)}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200/60 p-4">
                          <p className="text-xs text-gray-500">
                            Aucun créneau libre pour cette date. Essayez un autre jour ou changez de barbier.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 2: TEAM (LIGHT) ═══════════ */}
          {tab === "team" && (
            <div className="space-y-3">
              {shop.barbers.length === 0 ? (
                <div className="rounded-3xl bg-white border border-gray-100 p-8 text-center text-gray-500 text-xs shadow-sm">
                  Aucun barbier assigné pour l'instant.
                </div>
              ) : (
                shop.barbers.map(barber => {
                  const r = getBRating(barber);
                  return (
                    <div
                      key={barber.id}
                      onClick={() => setActiveBarber(barber)}
                      className="group rounded-3xl bg-white hover:bg-gray-50 border border-gray-100 p-4 flex items-center gap-4 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                    >
                      {barber.user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={barber.user.image}
                          alt={barber.user.name}
                          className="h-16 w-16 rounded-2xl object-cover shrink-0 border border-gray-200"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-sm">
                          {barber.user.name[0]}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-sm text-gray-900 truncate">{barber.user.name}</p>
                          <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                            Coiffeur Pro
                          </span>
                        </div>

                        {r && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-500 font-bold">
                            <Star className="h-3 w-3 fill-amber-400" />
                            <span>{r.toFixed(1)}</span>
                            <span className="text-gray-400 font-normal">({barber.reviews?.length || 5} avis)</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{barber.bio || "Expert en dégradés et barbe."}</p>
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setTab("book");
                          setBooking(b => ({ ...b, barber: barber.id, time: "", assignedBarberId: "" }));
                        }}
                        className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-violet-200 active:scale-95 transition-all cursor-pointer"
                      >
                        Réserver
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ═══════════ TAB 3: REVIEWS (LIGHT) ═══════════ */}
          {tab === "reviews" && (
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="rounded-3xl bg-white border border-gray-100 p-12 text-center shadow-sm">
                  <Star className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="font-black text-gray-900 text-sm">Aucun avis pour l'instant</p>
                  <p className="text-xs text-gray-500 mt-1">Réservez dès maintenant et soyez le premier à donner votre avis !</p>
                </div>
              ) : (
                <>
                  {shopRating && (
                    <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm flex items-center gap-6">
                      <div className="text-center shrink-0">
                        <p className="text-4xl font-black text-gray-900 tracking-tight">{shopRating.toFixed(1)}</p>
                        <div className="flex justify-center mt-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${s <= Math.round(shopRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                            />
                          ))}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">{reviews.length} avis clients</p>
                      </div>

                      <div className="flex-1 space-y-1.5 border-l border-gray-100 pl-4">
                        {[5, 4, 3, 2, 1].map(s => {
                          const c = reviews.filter(r => r.rating === s).length;
                          return (
                            <div key={s} className="flex items-center gap-2 text-xs">
                              <span className="text-gray-400 font-bold w-2">{s}</span>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full"
                                  style={{ width: `${reviews.length ? (c / reviews.length) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {reviews.map(rev => (
                    <div key={rev.id} className="rounded-3xl bg-white border border-gray-100 p-4 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {rev.client?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={rev.client.image} alt={rev.client.name} className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-600 font-black text-xs flex items-center justify-center">
                              {rev.client?.name?.[0] || "?"}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-black text-gray-900">{rev.client?.name || "Client"}</p>
                            <div className="flex mt-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                  key={s}
                                  className={`h-3 w-3 ${s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] text-gray-400">
                          {new Date(rev.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </span>
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl italic leading-relaxed border border-gray-100">
                          "{rev.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── STICKY FLOATING CONFIRMATION FOOTER (LIGHT) ── */}
      <div className={`fixed inset-x-0 z-50 px-4 transition-all duration-300 ${
        ready ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)" }}
      >
        <div className="mx-auto max-w-lg bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-xl flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-500 truncate">
              {safeFormatDate(booking.date)} · {formatTime(booking.time)}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-black text-sm text-gray-900 truncate">{svc?.name}</p>
            </div>
          </div>

          <button
            onClick={() => setShowSheet(true)}
            className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-violet-200 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            {hasDiscount ? (
              <span className="flex items-center gap-1.5">
                <span className="text-[11px] text-violet-200 line-through font-normal">{formatPrice(origPrice)}</span>
                <span>{formatPrice(finalPrice)}</span>
              </span>
            ) : (
              <span>{formatPrice(finalPrice)}</span>
            )}
            <span>Continuer →</span>
          </button>
        </div>
      </div>

      {/* ── BOTTOM SHEET CONFIRMATION SUMMARY (LIGHT) ── */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowSheet(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-white border-t border-gray-100 rounded-t-[36px] shadow-2xl max-h-[90dvh] overflow-y-auto text-gray-900">
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1.5 w-12 bg-gray-200 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
              <p className="font-black text-base">Récapitulatif de votre rendez-vous</p>
              <button
                onClick={() => setShowSheet(false)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs">
                {[
                  ["Salon", shop.name],
                  ["Prestation", svc?.name || "—"],
                  ["Barbier", booking.barber === "any" ? "Premier disponible" : shop.barbers.find(b => b.id === booking.barber)?.user.name || "—"],
                  ["Date", safeFormatDate(booking.date)],
                  ["Heure", formatTime(booking.time)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-1 border-b border-gray-200/50 last:border-none">
                    <span className="text-gray-500 font-medium">{k}</span>
                    <span className="font-bold text-gray-900">{v}</span>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-3 border-t border-gray-200/60">
                  <span className="text-gray-600 font-bold">Total à régler sur place</span>
                  <div>
                    {isFreeReady ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 line-through">{formatPrice(origPrice)}</span>
                        <span className="font-black text-base text-emerald-600">0.00 DT</span>
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-md">OFFERT</span>
                      </div>
                    ) : hasDiscount ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 line-through">{formatPrice(origPrice)}</span>
                        <span className="font-black text-base text-red-600">{formatPrice(finalPrice)}</span>
                        <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">-{promoDiscount}%</span>
                      </div>
                    ) : (
                      <span className="font-black text-base text-gray-900">{formatPrice(origPrice)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Instructions spéciales (optionnel)</label>
                <textarea
                  value={booking.notes}
                  onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-violet-600 focus:bg-white focus:outline-none resize-none"
                  placeholder="Ex: barbe courte avec dégradé haut..."
                />
              </div>

              <button
                onClick={handleBook}
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 py-4 text-sm font-black text-white shadow-xl shadow-violet-500/25 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                {submitting ? "Validation en cours..." : isFreeReady ? "Confirmer — Rendez-vous GRATUIT 🎉" : "Confirmer mon rendez-vous"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN GALLERY MODAL ── */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <p className="text-white font-bold text-sm">Photos du Salon ({imgs.length})</p>
            <button
              onClick={() => setShowGallery(false)}
              className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-white hover:bg-neutral-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
            {imgs.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img}
                alt=""
                onClick={() => { setHeroIdx(i); setShowGallery(false); }}
                className="aspect-square w-full object-cover rounded-2xl cursor-pointer hover:scale-105 transition-transform border border-neutral-800"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── BARBER PROFILE MODAL (LIGHT) ── */}
      {activeBarber && (
        <Modal isOpen onClose={() => setActiveBarber(null)} title={activeBarber.user.name}>
          <div className="space-y-4 max-h-[75dvh] overflow-y-auto pr-1 text-gray-900">
            <div className="flex flex-col items-center gap-3 text-center">
              {activeBarber.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeBarber.user.image} alt={activeBarber.user.name} className="h-20 w-20 rounded-2xl object-cover border border-gray-200" />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl font-black text-white">
                  {activeBarber.user.name[0]}
                </div>
              )}
              {getBRating(activeBarber) && (
                <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span>{getBRating(activeBarber)!.toFixed(1)}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 p-4 rounded-2xl leading-relaxed">
              {activeBarber.bio || "Coiffeur et barbier expérimenté, spécialisé en coupes précises et soins personnalisés."}
            </p>

            {activeBarber.gallery && activeBarber.gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {activeBarber.gallery.map(p => (
                  <div key={p.id} className="aspect-square rounded-2xl overflow-hidden border border-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setTab("book");
                  setBooking(b => ({ ...b, barber: activeBarber.id, time: "", assignedBarberId: "" }));
                  setActiveBarber(null);
                  toast(`${activeBarber.user.name} sélectionné !`, "success");
                }}
                className="w-full rounded-2xl bg-violet-600 hover:bg-violet-700 py-3.5 text-xs font-black text-white active:scale-95 transition-transform"
              >
                Prendre rendez-vous avec {activeBarber.user.name}
              </button>
              <button
                onClick={() => setActiveBarber(null)}
                className="w-full rounded-2xl border border-gray-200 py-3 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
