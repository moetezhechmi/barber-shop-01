"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Tag, 
  Sparkles, 
  Clock, 
  Flame, 
  Calendar, 
  MapPin, 
  Store, 
  ArrowRight, 
  Percent, 
  Gift, 
  Scissors,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

interface Promotion {
  id: string;
  shopId: string;
  title: string;
  description: string | null;
  discount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  imageUrl?: string | null;
  shop: {
    id: string;
    name: string;
    address: string;
    image: string | null;
    phone?: string | null;
  };
}

const CATEGORY_CHIPS = [
  { key: "all", label: "Toutes les offres", icon: Sparkles },
  { key: "mariage", label: "Pack Marié 💍", query: "mari" },
  { key: "etudiant", label: "Étudiants 🎓", query: "étudiant" },
  { key: "flash", label: "Flash & Weekend ⚡", query: "flash" },
];

export default function ClientPromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = React.useState<Promotion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("all");

  const todayStr = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  React.useEffect(() => {
    async function loadPromotions() {
      try {
        setLoading(true);
        const res = await fetch("/api/promotions");
        if (res.ok) {
          const data = await res.json();
          setPromotions(data.promotions || []);
        }
      } catch (err) {
        console.error("Error fetching promotions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPromotions();
  }, []);

  // Filter promotions
  const filteredPromotions = React.useMemo(() => {
    if (filter === "all") return promotions;
    const cat = CATEGORY_CHIPS.find((c) => c.key === filter);
    if (!cat?.query) return promotions;
    const q = cat.query.toLowerCase();
    return promotions.filter((p) => {
      const matchTitle = (p.title || "").toLowerCase().includes(q);
      const matchDesc = (p.description || "").toLowerCase().includes(q);
      return matchTitle || matchDesc;
    });
  }, [filter, promotions]);

  const getDaysRemaining = (endDateStr: string) => {
    try {
      if (!endDateStr) return null;
      const end = new Date(endDateStr.split("T")[0]);
      const now = new Date(todayStr);
      const diffTime = end.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return "";
      const d = new Date(dateStr.split("T")[0]);
      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 pb-28">
      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-4 pt-6 pb-10 text-white shadow-md">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 h-44 w-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 h-44 w-44 rounded-full bg-violet-400/20 blur-xl pointer-events-none" />

        <div className="max-w-lg mx-auto relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase text-violet-100 mb-3 border border-white/20">
            <Flame className="h-3.5 w-3.5 text-amber-300" />
            Bons Plans & Réductions
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Offres Exclusives BarberPro ✂️
          </h1>
          <p className="mt-1 text-sm text-violet-100/90 leading-relaxed max-w-sm">
            Réservez les meilleures prestations avec réduction immédiate chez nos barbiers partenaires.
          </p>

          {/* Quick Stats banner */}
          <div className="mt-4 flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl bg-black/20 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white/90 border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>
                {promotions.length} offre{promotions.length > 1 ? "s" : ""} disponible{promotions.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/25 px-2.5 py-1.5 text-xs font-bold text-emerald-200 border border-emerald-400/30">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              <span>Remise directe au panier</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 relative z-20">
        {/* ── CATEGORY CHIPS ── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORY_CHIPS.map((cat) => {
            const Icon = cat.icon;
            const active = filter === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setFilter(cat.key)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                  active
                    ? "bg-gray-900 text-white shadow-gray-900/10"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200/80"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── PROMOTIONS LIST ── */}
        <div className="mt-4 space-y-4">
          {loading ? (
            // Skeleton Loader
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="h-6 w-32 bg-gray-200 rounded-lg" />
                    <div className="h-8 w-16 bg-gray-200 rounded-xl" />
                  </div>
                  <div className="h-4 w-4/5 bg-gray-200 rounded" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  <div className="h-11 w-full bg-gray-200 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : filteredPromotions.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
              <div className="h-14 w-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-3">
                <Tag className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Aucune offre dans cette catégorie</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Consultez toutes les offres disponibles ou revenez très bientôt pour de nouveaux bons plans.
              </p>
              <button
                onClick={() => setFilter("all")}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold active:scale-95 transition-transform"
              >
                Voir toutes les offres ({promotions.length})
              </button>
            </div>
          ) : (
            filteredPromotions.map((promo) => {
              const daysRemaining = getDaysRemaining(promo.endDate);
              const isUrgent = daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0;
              const isEnded = daysRemaining !== null && daysRemaining < 0;

              // Booking redirect link with all promotional parameters
              const promoBookingUrl = `/client/shops/${promo.shopId}?promo=true&promoId=${promo.id}&discount=${promo.discount}&startDate=${promo.startDate}&endDate=${promo.endDate}&title=${encodeURIComponent(promo.title)}`;

              return (
                <div
                  key={promo.id}
                  className="group bg-white rounded-3xl border border-gray-100/90 shadow-sm hover:shadow-md transition-all overflow-hidden relative"
                >
                  {/* Top Highlight strip */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500" />

                  <div className="p-5">
                    {/* Header: Title + Big Discount Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-violet-100 text-violet-700">
                            <Tag className="h-3 w-3" />
                            Offre spéciale
                          </span>
                          {isUrgent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 animate-pulse">
                              <Flame className="h-3 w-3" />
                              Derniers jours !
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight leading-snug">
                          {promo.title}
                        </h2>
                      </div>

                      {/* Discount Badge */}
                      <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white font-black px-3 py-1.5 shadow-sm">
                        <span className="text-lg leading-none">-{promo.discount}%</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">Remise</span>
                      </div>
                    </div>

                    {/* Description */}
                    {promo.description && (
                      <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {promo.description}
                      </p>
                    )}

                    {/* Shop Info Card */}
                    {promo.shop && (
                      <div className="mt-3 flex items-center justify-between p-2.5 rounded-2xl bg-gray-50/80 border border-gray-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-black shrink-0 overflow-hidden">
                            {promo.shop.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={promo.shop.image} alt={promo.shop.name} className="h-full w-full object-cover" />
                            ) : (
                              <Store className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{promo.shop.name}</p>
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 truncate">
                              <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
                              <span className="truncate">{promo.shop.address}</span>
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/client/shops/${promo.shopId}`}
                          className="shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-800 p-1"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    )}

                    {/* Validity & Days Remaining */}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>Jusqu&apos;au {formatDate(promo.endDate)}</span>
                      </div>

                      {daysRemaining !== null && !isEnded && (
                        <div className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg text-[11px]">
                          <Clock className="h-3 w-3" />
                          <span>
                            {daysRemaining === 0 ? "Expire aujourd'hui" : `Encore ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CTA Button: Profiter de l'offre */}
                    <div className="mt-4">
                      <Link
                        href={promoBookingUrl}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-sm py-3 px-4 shadow-md shadow-violet-500/20 active:scale-[0.98] transition-all"
                      >
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        <span>Profiter de l&apos;offre (-{promo.discount}%)</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── FOOTER PROMO GUARANTEE ── */}
        <div className="mt-8 rounded-3xl bg-violet-50/70 border border-violet-100 p-4 text-center">
          <p className="text-xs font-bold text-violet-900">✨ Comment ça fonctionne ?</p>
          <p className="text-[11px] text-violet-700/80 mt-1 max-w-sm mx-auto leading-relaxed">
            Cliquez sur <strong>Profiter de l&apos;offre</strong>. La remise s&apos;applique directement sur les prestations du salon avec les prix barrés affichés en temps réel.
          </p>
        </div>
      </div>
    </div>
  );
}
