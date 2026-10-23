"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Star, MapPin, Phone, Scissors, Clock, CheckCircle,
  ArrowLeft, Sparkles, Loader2, X, CalendarDays,
  Wifi, Coffee, Gamepad, Snowflake, Car, ChevronDown, ChevronUp, Tag
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";

/* ── social SVGs ── */
const IgIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="3"/></svg>;
const FbIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.95z"/></svg>;
const TkIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.525.02c1.31-.03 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.21-.42-.45-.61-.7-.02 3.68-.01 7.36-.02 11.04-.1 1.72-.77 3.47-2.07 4.59-1.27 1.14-3.03 1.75-4.74 1.78-1.72.03-3.51-.48-4.82-1.57-1.37-1.12-2.18-2.91-2.29-4.67-.16-2.52 1.34-5.01 3.73-5.87.5-.18 1.04-.3 1.57-.36v4.13c-.4.07-.82.19-1.19.4-.87.49-1.34 1.53-1.13 2.53.16.82.81 1.48 1.62 1.64.97.21 2.05-.18 2.52-1.07.22-.4.29-.87.28-1.32-.01-4.08 0-8.15-.01-12.23.01-.15.01-.3 0-.45z"/></svg>;

const AMENITIES = [
  { key: "wifi", label: "Wi-Fi", icon: Wifi },
  { key: "coffee", label: "Café", icon: Coffee },
  { key: "playstation", label: "PS5", icon: Gamepad },
  { key: "ac", label: "Climatiseur", icon: Snowflake },
  { key: "parking", label: "Parking", icon: Car },
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

  // Handle URL query parameters (e.g., from notifications or marketing links)
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
    ]).then(([sd, rd, pd]) => { 
      setShop(sd.shop ?? sd); 
      setReviews(rd.reviews || []); 
      setPromotions(pd.promotions || []);
    })
      .catch(() => setError("Impossible de charger le salon")).finally(() => setLoading(false));
  }, [params.id]);

  // Load barber availability slots when barber & date are chosen
  React.useEffect(() => {
    if (!booking.barber || !booking.date || !shop) { setSlots([]); return; }
    setSlotsLoading(true);
    (async () => {
      try {
        if (booking.barber === "any") {
          const res = await Promise.all(shop.barbers.map(b => fetch(`/api/barbers/${b.id}/availability?date=${booking.date}`).then(r => r.ok ? r.json() : { slots: [] }).then(d => ({ id: b.id, slots: Array.isArray(d.slots) ? d.slots : [] }))));
          const seen = new Set<string>(); const out: typeof slots = [];
          res.forEach(r => r.slots.forEach((t: string) => { if (!seen.has(t)) { seen.add(t); out.push({ time: t, barberId: r.id }); } }));
          setSlots(out.sort((a, b) => a.time.localeCompare(b.time)));
        } else {
          const d = await fetch(`/api/barbers/${booking.barber}/availability?date=${booking.date}`).then(r => r.json());
          setSlots((Array.isArray(d.slots) ? d.slots : []).map((t: string) => ({ time: t, barberId: booking.barber })));
        }
      } catch { setSlots([]); } finally { setSlotsLoading(false); }
    })();
  }, [booking.barber, booking.date, shop]);

  // Price calculations
  const svc = React.useMemo(() => shop?.services.find(s => s.id === booking.service), [shop, booking.service]);
  const origPrice = svc?.price ?? 0;
  const discountVal = Number(promoDiscount);
  const hasDiscount = isPromo && !isNaN(discountVal) && discountVal > 0;
  const finalPrice = hasDiscount ? origPrice * (1 - discountVal / 100) : origPrice;
  const shopRating = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null;
  const imgs = shop?.images ?? [];
  const s1 = !!booking.service, s2 = !!booking.barber, s3 = !!booking.date && !!booking.time;
  const ready = s1 && s2 && s3;
  const getBRating = (b: Barber) => b.reviews?.length ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length : null;

  // Filter valid promotions (active or not yet expired)
  const displayPromotions = React.useMemo(() => {
    if (!promotions || promotions.length === 0) return [];
    const valid = promotions.filter(p => {
      if (p.isActive === false) return false;
      const end = (p.endDate || "").split("T")[0];
      return !end || end >= todayStr;
    });
    // Fallback: if all existing promos have expired dates, still show the latest one for demo/testing
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

    // If promo starts in future, sync calendar month/year
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

    // Reset date if existing selection is outside promo range
    if (booking.date) {
      if ((startStr && booking.date < startStr) || (endStr && booking.date > endStr)) {
        setBooking(b => ({ ...b, date: "", time: "", assignedBarberId: "" }));
      }
    }

    // Bascule sur l'onglet "Réserver"
    setTab("book");

    // Scroll vers les tabs
    setTimeout(() => {
      const el = tabsRef.current || document.getElementById("booking-tabs");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);

    toast(`Offre -${promo.discount}% activée ! Prix barrés appliqués.`, "success");
  };

  // Handle removing promo
  const handleRemovePromo = () => {
    setIsPromo(false);
    setPromoDiscount("");
    setPromoStart("");
    setPromoEnd("");
    setActivePromoTitle("");
    toast("Promotion retirée", "info");
  };

  const handleBook = async () => {
    if (!ready || !booking.assignedBarberId) { toast("Veuillez compléter toutes les étapes", "error"); return; }
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
          notes: noteWithPromo
        })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Erreur");
      setConfirmation((await res.json()).appointment ?? {});
      toast("Rendez-vous confirmé !", "success");
      setShowSheet(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-dvh items-center justify-center bg-white"><div className="h-12 w-12 rounded-2xl border-4 border-violet-100 border-t-violet-600 animate-spin" /></div>;
  if (error || !shop) return <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center"><p className="text-red-500">{error || "Salon introuvable"}</p><button onClick={() => router.back()} className="text-sm text-violet-600 underline">Retour</button></div>;

  if (confirmation) {
    const barber = shop.barbers.find(b => b.id === booking.assignedBarberId);
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-5 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-3xl p-7 text-center shadow-xl">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Réservé !</h2>
          <p className="text-sm text-gray-500 mt-1">Votre créneau est confirmé.</p>
          <div className="mt-5 space-y-2 bg-gray-50 rounded-2xl p-4 text-sm text-left">
            {[
              ["Service", svc?.name || "—"],
              ["Barbier", barber?.user.name || "—"],
              ["Prix", isPromo && promoDiscount ? `${formatPrice(finalPrice)} (-${promoDiscount}%)` : formatPrice(origPrice)],
              ["Date", safeFormatDate(booking.date)],
              ["Heure", formatTime(booking.time)]
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-gray-400">{k}</span><span className="font-semibold text-gray-900">{v}</span></div>
            ))}
          </div>
          <button onClick={() => router.push("/client/appointments")} className="mt-5 w-full rounded-2xl bg-violet-600 py-4 text-sm font-bold text-white shadow-lg shadow-violet-200">Voir mes rendez-vous</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 pb-[160px]">

      {/* ── HERO with rounded bottom ── */}
      <div className="relative overflow-hidden bg-gray-900 rounded-b-[32px]"
        style={{ height: 280 }}
        onTouchStart={e => { tx0.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          const diff = tx0.current - e.changedTouches[0].clientX;
          const len = imgs.length;
          if (Math.abs(diff) < 40 || len <= 1) return;
          setHeroIdx(p => diff > 0 ? (p < len-1 ? p+1 : 0) : (p > 0 ? p-1 : len-1));
        }}>
        {imgs.length > 0
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={imgs[heroIdx]} alt={shop.name} className="absolute inset-0 h-full w-full object-cover" />
          : <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-700" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent rounded-b-[32px]" />

        {/* gallery count */}
        {imgs.length > 1 && (
          <button onClick={() => setShowGallery(true)} className="absolute right-4 top-5 z-10 rounded-full bg-black/40 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5">
            <span>{heroIdx + 1}</span><span className="opacity-60">/</span><span className="opacity-60">{imgs.length}</span>
          </button>
        )}

        {/* dots */}
        {imgs.length > 1 && (
          <div className="absolute bottom-[88px] left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {imgs.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i === heroIdx ? "w-5 bg-white" : "w-1.5 bg-white/40"}`} />)}
          </div>
        )}

        {/* shop card overlay */}
        <div className="absolute bottom-0 inset-x-0 p-5 z-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">{shop.name}</h1>
              <div className="mt-1.5 space-y-1">
                <p className="flex items-center gap-1.5 text-xs text-white/80"><MapPin className="h-3.5 w-3.5 text-violet-300 shrink-0" />{shop.address}</p>
                {shop.phone && (
                  <a href={`tel:${shop.phone}`} className="flex items-center gap-1.5 text-xs text-white/90 font-medium w-fit">
                    <Phone className="h-3.5 w-3.5 text-violet-300 shrink-0" />{shop.phone}
                  </a>
                )}
                {shopRating && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(shopRating) ? "fill-amber-400 text-amber-400" : "text-white/30"}`} />)}</div>
                    <span className="text-xs font-bold text-amber-400">{shopRating.toFixed(1)}</span>
                    <span className="text-xs text-white/50">({reviews.length})</span>
                  </div>
                )}
              </div>
            </div>
            {/* socials */}
            {(shop.instagram || shop.facebook || shop.tiktok) && (
              <div className="flex flex-col gap-2 shrink-0">
                {shop.instagram && <a href={shop.instagram} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"><IgIcon /></a>}
                {shop.facebook  && <a href={shop.facebook}  target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"><FbIcon /></a>}
                {shop.tiktok    && <a href={shop.tiktok}    target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white active:scale-95 transition-transform"><TkIcon /></a>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DESCRIPTION (collapsible) ── */}
      {shop.description && (
        <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
          <p className={`text-sm text-gray-600 leading-relaxed ${showDesc ? "" : "line-clamp-2"}`}>{shop.description}</p>
          <button onClick={() => setShowDesc(p => !p)} className="flex items-center gap-1 text-xs font-semibold text-violet-600 mt-2">
            {showDesc ? <><ChevronUp className="h-3.5 w-3.5" />Moins</> : <><ChevronDown className="h-3.5 w-3.5" />Plus</>}
          </button>
        </div>
      )}

      {/* ── AMENITIES ── */}
      {shop.amenities && shop.amenities.length > 0 && (
        <div className="mx-4 mt-3 flex flex-wrap gap-2">
          {AMENITIES.filter(a => shop.amenities!.includes(a.key)).map(a => {
            const Icon = a.icon;
            return (
              <span key={a.key} className="inline-flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-full px-3 py-1.5 text-xs font-semibold text-violet-700">
                <Icon className="h-3.5 w-3.5" />{a.label}
              </span>
            );
          })}
        </div>
      )}

      {/* ── PROMOTIONS ── */}
      {displayPromotions.length > 0 && (
        <div className="mx-4 mt-3 space-y-2">
          {displayPromotions.map(promo => {
            const isApplied = isPromo && promoDiscount === promo.discount.toString();
            return (
              <div key={promo.id} className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-4 text-white flex items-center gap-3 shadow-md relative overflow-hidden">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                  <span className="text-xl font-black">-{promo.discount}%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm tracking-tight truncate">{promo.title}</p>
                    <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Offre
                    </span>
                  </div>
                  {promo.description && <p className="text-xs text-white/90 mt-0.5 line-clamp-1">{promo.description}</p>}
                  <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1 font-medium">
                    <CalendarDays className="h-3 w-3 inline shrink-0" />
                    {promo.endDate ? `Jusqu'au ${safeFormatDate(promo.endDate)}` : "Offre à durée limitée"}
                  </p>
                </div>
                <button 
                  onClick={() => handleApplyPromo(promo)}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                    isApplied
                      ? "bg-emerald-500 text-white ring-2 ring-white/60 hover:bg-emerald-600"
                      : "bg-white text-orange-600 hover:bg-orange-50"
                  }`}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {isApplied ? "Actif ✓" : "Profiter"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TABS ── */}
      <div 
        ref={tabsRef}
        id="booking-tabs"
        className="mx-4 mt-4 bg-white rounded-2xl p-1.5 flex gap-1 shadow-sm scroll-mt-6"
      >
        {(["book","team","reviews"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${tab === t ? "bg-violet-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
            {t === "book" ? "Réserver" : t === "team" ? "Équipe" : `Avis ${reviews.length > 0 ? `(${reviews.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="mx-4 mt-3 space-y-3">

        {/* ── TAB BOOK ── */}
        {tab === "book" && (
          <>
            {isPromo && promoDiscount && (
              <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/80 rounded-2xl p-4 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                    -{promoDiscount}%
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-red-900 truncate">
                      {activePromoTitle ? `Promo active : ${activePromoTitle}` : "Promo active"}
                    </p>
                    <p className="text-xs text-red-700/80 mt-0.5">
                      {promoStart && promoEnd ? `Valable du ${safeFormatDate(promoStart)} au ${safeFormatDate(promoEnd)}` : "Remise immédiate appliquée"}
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                      ✓ Prix barrés appliqués sur toutes les prestations
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemovePromo}
                  className="shrink-0 text-xs font-semibold text-gray-500 hover:text-red-600 bg-white border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  title="Retirer la promotion"
                >
                  Retirer
                </button>
              </div>
            )}

            {/* STEP 1 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${s1 ? "bg-green-500 text-white" : "bg-violet-600 text-white"}`}>
                  {s1 ? <CheckCircle className="h-4 w-4" /> : "1"}
                </div>
                <p className="font-bold text-gray-900 text-sm">Choisir une prestation</p>
                {s1 && (
                  <div className="ml-auto text-right truncate max-w-[140px]">
                    <span className="text-xs font-semibold text-violet-600 truncate block">{svc?.name}</span>
                    {hasDiscount && svc && (
                      <span className="text-[11px] font-bold text-red-600">
                        {formatPrice(finalPrice)} <span className="line-through text-gray-400 font-normal">{formatPrice(origPrice)}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                {shop.services.map(service => {
                  const sel = booking.service === service.id;
                  const p = hasDiscount ? service.price * (1 - discountVal / 100) : service.price;
                  return (
                    <button key={service.id} onClick={() => setBooking(b => ({ ...b, service: service.id }))}
                      className={`w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all active:scale-[0.99] cursor-pointer ${sel ? "bg-violet-50 ring-2 ring-violet-500" : "bg-gray-50 hover:bg-gray-100"}`}>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${sel ? "bg-violet-600 text-white" : "bg-white text-gray-400 shadow-sm"}`}>
                        <Scissors className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900">{service.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" />{service.duration} min</p>
                      </div>
                      <div className="text-right shrink-0">
                        {hasDiscount ? (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-gray-400 line-through">
                                {formatPrice(service.price)}
                              </span>
                              <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">
                                -{promoDiscount}%
                              </span>
                            </div>
                            <p className="text-sm font-black text-red-600">
                              {formatPrice(p)}
                            </p>
                          </div>
                        ) : (
                          <p className={`text-sm font-black ${sel ? "text-violet-600" : "text-gray-900"}`}>{formatPrice(service.price)}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2 */}
            <div className={`bg-white rounded-2xl overflow-hidden shadow-sm transition-opacity ${s1 ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
              <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${s2 ? "bg-green-500 text-white" : s1 ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                  {s2 ? <CheckCircle className="h-4 w-4" /> : "2"}
                </div>
                <p className="font-bold text-gray-900 text-sm">Choisir un barbier</p>
                {s2 && <span className="ml-auto text-xs font-semibold text-violet-600">{booking.barber === "any" ? "Premier dispo" : shop.barbers.find(b => b.id === booking.barber)?.user.name}</span>}
              </div>
              <div className="flex gap-3 overflow-x-auto p-4 hide-scrollbar">
                {/* any */}
                <button onClick={() => setBooking(b => ({ ...b, barber: "any", time: "", assignedBarberId: "" }))}
                  className={`shrink-0 flex flex-col items-center gap-2 rounded-2xl w-24 py-4 px-2 transition-all active:scale-95 cursor-pointer ${booking.barber === "any" ? "bg-violet-50 ring-2 ring-violet-500" : "bg-gray-50"}`}>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${booking.barber === "any" ? "bg-violet-600 text-white" : "bg-white text-gray-400 shadow-sm"}`}>
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] font-bold text-gray-800 text-center leading-tight">N'importe</p>
                </button>
                {shop.barbers.map(barber => {
                  const sel = booking.barber === barber.id;
                  const r = getBRating(barber);
                  return (
                    <button key={barber.id} onClick={() => setBooking(b => ({ ...b, barber: barber.id, time: "", assignedBarberId: "" }))}
                      className={`shrink-0 flex flex-col items-center gap-2 rounded-2xl w-24 py-4 px-2 transition-all active:scale-95 cursor-pointer ${sel ? "bg-violet-50 ring-2 ring-violet-500" : "bg-gray-50"}`}>
                      <div className="relative">
                        {barber.user.image
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={barber.user.image} alt={barber.user.name} className="h-12 w-12 rounded-full object-cover" />
                          : <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-base">{barber.user.name[0]}</div>}
                        {sel && <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center"><CheckCircle className="h-3 w-3 text-white" /></div>}
                      </div>
                      <p className="text-[11px] font-bold text-gray-800 truncate w-full text-center">{barber.user.name}</p>
                      {r && <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-amber-500" />{r.toFixed(1)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3 */}
            <div className={`bg-white rounded-2xl overflow-hidden shadow-sm transition-opacity ${s2 ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
              <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${s3 ? "bg-green-500 text-white" : s2 ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                  {s3 ? <CheckCircle className="h-4 w-4" /> : "3"}
                </div>
                <p className="font-bold text-gray-900 text-sm">Date & Heure</p>
                {s3 && <span className="ml-auto text-xs font-semibold text-violet-600">{safeFormatDate(booking.date)} · {formatTime(booking.time)}</span>}
              </div>
              <div className="p-4 space-y-4">
                {/* Calendar */}
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
                  
                  const days = Array.from({ length: firstDay }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
                  
                  return (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      {isPromo && (promoStart || promoEnd) && (
                        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200/60 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                          <span className="font-semibold flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                            Dates de l'offre
                          </span>
                          <span className="font-bold">
                            {promoStart ? safeFormatDate(promoStart) : ""} → {promoEnd ? safeFormatDate(promoEnd) : ""}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={() => canPrev && setCalMonth(m => m === 0 ? (setCalYear(y => y - 1), 11) : m - 1)}
                          className={`h-8 w-8 rounded-lg flex items-center justify-center ${canPrev ? "bg-white text-gray-700 active:scale-95 shadow-sm" : "text-gray-300"}`} disabled={!canPrev}>
                          ‹
                        </button>
                        <p className="font-black text-gray-900 capitalize">{monthName} {calYear}</p>
                        <button onClick={() => canNext && setCalMonth(m => m === 11 ? (setCalYear(y => y + 1), 0) : m + 1)}
                          className={`h-8 w-8 rounded-lg flex items-center justify-center ${canNext ? "bg-white text-gray-700 active:scale-95 shadow-sm" : "text-gray-300"}`} disabled={!canNext}>
                          ›
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
                          <div key={i} className="h-8 flex items-center justify-center text-[10px] font-bold text-gray-400">{d}</div>
                        ))}
                      </div>
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
                            <button key={idx} onClick={() => !disabled && setBooking(b => ({ ...b, date: dateStr, time: "", assignedBarberId: "" }))}
                              disabled={disabled}
                              className={`h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                                selected ? "bg-violet-600 text-white scale-105 shadow-md" :
                                disabled ? "text-gray-300 cursor-not-allowed" :
                                "bg-white text-gray-700 hover:bg-violet-50 active:scale-95 shadow-sm cursor-pointer"
                              }`}>
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                
                {/* Time slots */}
                {booking.date && (slotsLoading
                  ? <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
                  : slots.length > 0
                    ? <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 px-1">Créneaux disponibles</p>
                        <div className="grid grid-cols-4 gap-2">
                          {slots.map((s, i) => (
                            <button key={`${s.time}-${i}`} onClick={() => setBooking(b => ({ ...b, time: s.time, assignedBarberId: s.barberId }))}
                              className={`rounded-xl py-3 text-xs font-bold transition-all active:scale-95 cursor-pointer ${booking.time === s.time ? "bg-violet-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                              {formatTime(s.time)}
                            </button>
                          ))}
                        </div>
                      </div>
                    : <p className="text-center text-sm text-gray-400 py-5 bg-gray-50 rounded-xl">Aucun créneau · essayez une autre date.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── TAB TEAM ── */}
        {tab === "team" && (
          <div className="space-y-3">
            {shop.barbers.length === 0
              ? <p className="text-center text-gray-400 py-12 text-sm">Aucun barbier.</p>
              : shop.barbers.map(barber => {
                  const r = getBRating(barber);
                  return (
                    <div key={barber.id} onClick={() => setActiveBarber(barber)}
                      className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer">
                      {barber.user.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={barber.user.image} alt={barber.user.name} className="h-14 w-14 rounded-2xl object-cover shrink-0" />
                        : <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-xl font-bold text-white shrink-0">{barber.user.name[0]}</div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900">{barber.user.name}</p>
                        {r && <div className="flex items-center gap-1 mt-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= Math.round(r) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}<span className="text-xs text-gray-500 ml-1">{r.toFixed(1)}</span></div>}
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{barber.bio || "Expert coiffure"}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setTab("book"); setBooking(b => ({ ...b, barber: barber.id, time: "", assignedBarberId: "" })); }}
                        className="shrink-0 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white active:scale-95 transition-transform">
                        Choisir
                      </button>
                    </div>
                  );
                })}
          </div>
        )}

        {/* ── TAB REVIEWS ── */}
        {tab === "reviews" && (
          <div className="space-y-3">
            {reviews.length === 0
              ? <div className="bg-white rounded-2xl p-12 text-center shadow-sm"><Star className="h-8 w-8 text-gray-200 mx-auto mb-2" /><p className="font-bold text-gray-900 text-sm">Aucun avis</p><p className="text-xs text-gray-400 mt-1">Soyez le premier !</p></div>
              : <>
                  {shopRating && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-5">
                      <div className="text-center">
                        <p className="text-4xl font-black text-gray-900">{shopRating.toFixed(1)}</p>
                        <div className="flex mt-1">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(shopRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}</div>
                        <p className="text-xs text-gray-400 mt-1">{reviews.length} avis</p>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[5,4,3,2,1].map(s => { const c = reviews.filter(r => r.rating===s).length; return (
                          <div key={s} className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-2">{s}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-amber-400 rounded-full" style={{ width: `${reviews.length ? (c/reviews.length)*100 : 0}%` }} /></div>
                          </div>
                        ); })}
                      </div>
                    </div>
                  )}
                  {reviews.map(rev => (
                    <div key={rev.id} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {rev.client?.image
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={rev.client.image} alt={rev.client.name} className="h-9 w-9 rounded-full object-cover" />
                            : <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">{rev.client?.name?.[0]||"?"}</div>}
                          <div>
                            <p className="text-sm font-bold text-gray-900">{rev.client?.name||"Client"}</p>
                            <div className="flex mt-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s<=rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400">{new Date(rev.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span>
                      </div>
                      {rev.comment && <p className="mt-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl italic">"{rev.comment}"</p>}
                    </div>
                  ))}
                </>}
          </div>
        )}
      </div>

      {/* ── STICKY CTA ── */}
      <div className={`fixed bottom-[72px] inset-x-0 z-30 px-4 pb-2 transition-all duration-300 ${ready ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}>
        <div className="mx-auto max-w-lg flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-xl border border-gray-100">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate">{svc?.name}</p>
            <p className="text-xs text-gray-400">{safeFormatDate(booking.date)} · {formatTime(booking.time)}</p>
          </div>
          <button onClick={() => setShowSheet(true)}
            className="shrink-0 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-violet-200 active:scale-95 transition-transform flex items-center gap-2 cursor-pointer">
            {hasDiscount ? (
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-violet-200 line-through font-normal">{formatPrice(origPrice)}</span>
                <span>{formatPrice(finalPrice)}</span>
              </span>
            ) : (
              <span>{formatPrice(finalPrice)}</span>
            )}
            <span>→</span>
          </button>
        </div>
      </div>

      {/* ── BOTTOM SHEET ── */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSheet(false)} />
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-2"><div className="h-1 w-10 bg-gray-200 rounded-full" /></div>
            <div className="flex items-center justify-between px-5 py-3">
              <p className="font-black text-gray-900">Récapitulatif</p>
              <button onClick={() => setShowSheet(false)} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-5 pb-8 space-y-4">
              <div className="space-y-3 bg-gray-50 rounded-2xl p-4 text-sm">
                {[
                  ["Service", svc?.name || "—"],
                  ["Barbier", booking.barber === "any" ? "Premier disponible" : shop.barbers.find(b => b.id === booking.barber)?.user.name || "—"],
                  ["Date", safeFormatDate(booking.date)],
                  ["Heure", formatTime(booking.time)]
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-semibold text-gray-900">{v}</span>
                  </div>
                ))}

                {/* Price summary line with crossed out price */}
                <div className="flex justify-between items-center border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500 font-medium">Prix total</span>
                  <div className="text-right">
                    {hasDiscount ? (
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
                <p className="text-xs font-semibold text-gray-500 mb-2">Note (optionnel)</p>
                <textarea value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))} rows={2}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none resize-none"
                  placeholder="Ex: laisser de la longueur..." />
              </div>
              <button onClick={handleBook} disabled={submitting}
                className="w-full rounded-2xl bg-violet-600 py-4 text-sm font-black text-white shadow-lg shadow-violet-200 active:scale-[0.99] transition-transform disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                {submitting ? "Confirmation..." : "Confirmer"}
              </button>
              <div className="h-2" />
            </div>
          </div>
        </div>
      )}

      {/* ── GALLERY ── */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4">
            <p className="text-white font-bold">Photos</p>
            <button onClick={() => setShowGallery(false)} className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
            {imgs.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={img} alt="" onClick={() => { setHeroIdx(i); setShowGallery(false); }}
                className="aspect-square w-full object-cover rounded-2xl cursor-pointer active:opacity-70" />
            ))}
          </div>
        </div>
      )}

      {/* ── BARBER MODAL ── */}
      {activeBarber && (
        <Modal isOpen onClose={() => setActiveBarber(null)} title={activeBarber.user.name}>
          <div className="space-y-4 max-h-[75dvh] overflow-y-auto pr-1">
            <div className="flex flex-col items-center gap-3 text-center">
              {activeBarber.user.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={activeBarber.user.image} alt={activeBarber.user.name} className="h-20 w-20 rounded-full object-cover" />
                : <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-3xl font-bold text-white">{activeBarber.user.name[0]}</div>}
              {getBRating(activeBarber) && <div className="flex items-center gap-1">{[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= Math.round(getBRating(activeBarber)!) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}<span className="text-sm font-bold text-gray-600 ml-1">{getBRating(activeBarber)!.toFixed(1)}</span></div>}
            </div>
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-2xl leading-relaxed">{activeBarber.bio || "Expert des coupes modernes."}</p>
            {activeBarber.gallery && activeBarber.gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {activeBarber.gallery.map(p => (
                  <div key={p.id} className="aspect-square rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 pb-2">
              <button onClick={() => { setTab("book"); setBooking(b => ({ ...b, barber: activeBarber.id, time: "", assignedBarberId: "" })); setActiveBarber(null); toast(`${activeBarber.user.name} sélectionné !`, "success"); }}
                className="w-full rounded-2xl bg-violet-600 py-4 text-sm font-black text-white active:scale-[0.99] transition-transform">
                Réserver avec {activeBarber.user.name}
              </button>
              <button onClick={() => setActiveBarber(null)} className="w-full rounded-2xl border border-gray-200 py-4 text-sm font-semibold text-gray-600">Fermer</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
