"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Megaphone, 
  Sparkles, 
  Plus, 
  PlusCircle, 
  Tag, 
  Trash2, 
  Calendar, 
  Clock, 
  Flame, 
  Eye, 
  ExternalLink, 
  CheckCircle, 
  Percent, 
  Gift, 
  Bell, 
  Heart,
  Store,
  ArrowRight,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

interface ShopData {
  id: string;
  name: string;
  description: string | null;
  address: string;
  ownerId: string;
}

interface PromotionData {
  id: string;
  shopId: string;
  title: string;
  description: string | null;
  discount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  imageUrl?: string | null;
  createdAt: string;
}

// 6 Ready-to-use Marketing Templates
const PROMO_TEMPLATES = [
  {
    title: "Pack Marié VIP 💍",
    description: "Coiffure prestige + Barbe à l'ancienne + Soin éclat du visage + Finition vapeur pour votre grand jour.",
    discount: 25,
    days: 30,
    tag: "Mariage",
    color: "from-amber-500 to-rose-500",
  },
  {
    title: "Offre Étudiant 🎓",
    description: "Coupe stylée + Coiffage offerte sur présentation d'une carte étudiante en cours de validité.",
    discount: 20,
    days: 60,
    tag: "Étudiants",
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Weekend Flash ⚡",
    description: "Remise exclusive valable uniquement les vendredis et samedis sur toutes les formules complètes.",
    discount: 15,
    days: 7,
    tag: "Flash",
    color: "from-violet-600 to-purple-600",
  },
  {
    title: "Spécial Fêtes & Aïd 🌙",
    description: "Préparez les festivités avec un soin complet cheveux + barbe et contours sculptés au rasoir.",
    discount: 30,
    days: 14,
    tag: "Fêtes",
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "Forfait Duo Père & Fils 💈",
    description: "Venez à deux et profitez d'une remise spéciale sur les coupes adulte et enfant.",
    discount: 20,
    days: 30,
    tag: "Famille",
    color: "from-orange-500 to-amber-600",
  },
  {
    title: "Bienvenue Nouveau Client ✨",
    description: "Découvrez notre savoir-faire avec une remise immédiate sur votre tout premier rendez-vous.",
    discount: 10,
    days: 45,
    tag: "Bienvenue",
    color: "from-pink-500 to-rose-600",
  },
];

export default function OwnerPromotionsPage() {
  const { toast } = useToast();
  const [shop, setShop] = React.useState<ShopData | null>(null);
  const [promotions, setPromotions] = React.useState<PromotionData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [promoFilter, setPromoFilter] = React.useState<"all" | "active" | "expired">("all");
  const [showPromoModal, setShowPromoModal] = React.useState(false);
  const [savingPromo, setSavingPromo] = React.useState(false);

  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getFutureDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const todayStr = getTodayDate();

  const [newPromo, setNewPromo] = React.useState({
    title: "",
    description: "",
    discount: 20,
    startDate: todayStr,
    endDate: getFutureDate(14),
    imageUrl: "",
  });

  // Calculate remaining days
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

  // Filter promos
  const activePromotions = React.useMemo(() => {
    return promotions.filter((p) => {
      if (p.isActive === false) return false;
      const end = (p.endDate || "").split("T")[0];
      return !end || end >= todayStr;
    });
  }, [promotions, todayStr]);

  const expiredPromotions = React.useMemo(() => {
    return promotions.filter((p) => {
      const end = (p.endDate || "").split("T")[0];
      return end && end < todayStr;
    });
  }, [promotions, todayStr]);

  const filteredPromotions = React.useMemo(() => {
    if (promoFilter === "active") return activePromotions;
    if (promoFilter === "expired") return expiredPromotions;
    return promotions;
  }, [promoFilter, promotions, activePromotions, expiredPromotions]);

  // Load Shop & Promotions
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [meRes, shopsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/shops"),
      ]);

      if (!meRes.ok || !shopsRes.ok) throw new Error("Erreur de chargement");

      const meData = await meRes.json();
      const shopsData = await shopsRes.json();

      const userShop = (shopsData.shops || []).find(
        (s: ShopData) => s.ownerId === meData.user?.id
      );

      if (userShop) {
        setShop(userShop);
        const promoRes = await fetch(`/api/shops/${userShop.id}/promotions`);
        if (promoRes.ok) {
          const promoData = await promoRes.json();
          setPromotions(promoData.promotions || []);
        }
      }
    } catch (err) {
      console.error(err);
      toast("Impossible de charger les promotions", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply template into creation form
  const applyTemplate = (t: (typeof PROMO_TEMPLATES)[0]) => {
    setNewPromo({
      title: t.title,
      description: t.description,
      discount: t.discount,
      startDate: getTodayDate(),
      endDate: getFutureDate(t.days),
      imageUrl: "",
    });
    setShowPromoModal(true);
  };

  // Submit new promo
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    if (!newPromo.title.trim()) {
      toast("Veuillez renseigner un titre pour l'offre", "error");
      return;
    }
    if (newPromo.discount < 1 || newPromo.discount > 100) {
      toast("Le pourcentage doit être compris entre 1 et 100", "error");
      return;
    }

    setSavingPromo(true);
    try {
      const res = await fetch(`/api/shops/${shop.id}/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPromo.title,
          description: newPromo.description || null,
          discount: Number(newPromo.discount),
          startDate: newPromo.startDate,
          endDate: newPromo.endDate,
          imageUrl: newPromo.imageUrl || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      const data = await res.json();
      setPromotions((prev) => [data.promotion, ...prev]);
      setShowPromoModal(false);
      setNewPromo({
        title: "",
        description: "",
        discount: 20,
        startDate: getTodayDate(),
        endDate: getFutureDate(14),
        imageUrl: "",
      });
      toast("🎉 Offre créée avec succès ! Tous vos clients ont été notifiés.", "success");
    } catch (err: any) {
      toast(err.message || "Erreur de création", "error");
    } finally {
      setSavingPromo(false);
    }
  };

  // Delete promotion
  const handleDeletePromo = async (promoId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette promotion ?")) return;
    try {
      const res = await fetch(`/api/promotions/${promoId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de la suppression");
      }
      setPromotions((prev) => prev.filter((p) => p.id !== promoId));
      toast("Promotion supprimée avec succès", "success");
    } catch (err: any) {
      toast(err.message || "Erreur lors de la suppression", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
        <p className="text-sm font-semibold text-neutral-500">Chargement de vos promotions...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">Aucun salon configuré</h2>
        <p className="text-sm text-neutral-500">
          Veuillez créer ou configurer votre salon avant de pouvoir publier des promotions.
        </p>
        <Link href="/owner/shop">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold">
            Configurer mon salon
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Marketing & Croissance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
            Offres & Promotions 🏷️
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
            Créez des remises, packs mariages et offres flash. Vos clients reçoivent instantanément une notification dès la publication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/owner/shop">
            <Button variant="outline" className="rounded-xl border-neutral-300 text-xs font-bold gap-1.5">
              <Store className="h-3.5 w-3.5" />
              Mon Salon
            </Button>
          </Link>
          <Button
            onClick={() => {
              setNewPromo({
                title: "",
                description: "",
                discount: 20,
                startDate: getTodayDate(),
                endDate: getFutureDate(14),
                imageUrl: "",
              });
              setShowPromoModal(true);
            }}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-violet-500/20 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Promotion
          </Button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Total Offres</span>
            <div className="h-8 w-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 flex items-center justify-center">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-neutral-900 dark:text-neutral-50 mt-2">{promotions.length}</p>
          <span className="text-[10px] text-neutral-400">Créées au total</span>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">En cours</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{activePromotions.length}</p>
          <span className="text-[10px] text-emerald-600/80 font-medium">Actives aujourd&apos;hui</span>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Max Remise</span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">
            {promotions.length > 0 ? `-${Math.max(...promotions.map((p) => p.discount))}%` : "0%"}
          </p>
          <span className="text-[10px] text-neutral-400">Meilleure offre</span>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Notification Client</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">Auto</p>
          <span className="text-[10px] text-neutral-400">Envoi immédiat push & in-app</span>
        </div>
      </div>

      {/* ── 1-CLICK POPULAR TEMPLATES ── */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/30 border-b border-neutral-100 dark:border-neutral-800 py-3.5 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm sm:text-base font-bold">Modèles d&apos;offres en 1 clic</CardTitle>
            </div>
            <span className="text-xs text-neutral-400 hidden sm:inline">Cliquez pour pré-remplir</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROMO_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.title}
                onClick={() => applyTemplate(tmpl)}
                className="group text-left p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 hover:border-violet-500 dark:hover:border-violet-500 bg-white dark:bg-neutral-900 hover:shadow-md transition-all active:scale-[0.98] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100 group-hover:text-violet-600 transition-colors">
                      {tmpl.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 shrink-0">
                      -{tmpl.discount}%
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="font-semibold text-violet-600 dark:text-violet-400 group-hover:underline">
                    Utiliser ce modèle
                  </span>
                  <span>Durée : {tmpl.days}j</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── PROMOTIONS LIST ── */}
      <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 py-3.5 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-violet-600" />
            <CardTitle className="text-base font-bold">Vos offres publiées</CardTitle>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {promotions.length}
            </span>
          </div>

          {/* Filter tabs */}
          {promotions.length > 0 && (
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setPromoFilter("all")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  promoFilter === "all" ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-sm" : "text-neutral-500"
                }`}
              >
                Toutes ({promotions.length})
              </button>
              <button
                onClick={() => setPromoFilter("active")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  promoFilter === "active" ? "bg-white dark:bg-neutral-900 text-emerald-600 shadow-sm" : "text-neutral-500"
                }`}
              >
                En cours ({activePromotions.length})
              </button>
              <button
                onClick={() => setPromoFilter("expired")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  promoFilter === "expired" ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-sm" : "text-neutral-500"
                }`}
              >
                Expirées ({expiredPromotions.length})
              </button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {promotions.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 mx-auto mb-3">
                <Tag className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                Aucune promotion pour le moment
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                Lancez votre première offre (ex. Pack Marié, Étudiants ou Flash) pour booster vos réservations dès aujourd&apos;hui.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  onClick={() => applyTemplate(PROMO_TEMPLATES[0])}
                  className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Créer avec le Pack Marié 💍
                </Button>
              </div>
            </div>
          ) : filteredPromotions.length === 0 ? (
            <div className="text-center py-10 text-neutral-400">
              <p className="text-sm font-semibold">Aucune promotion dans cette catégorie</p>
              <button onClick={() => setPromoFilter("all")} className="text-xs text-violet-600 underline mt-1">
                Voir toutes les promotions
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPromotions.map((promo) => {
                const days = getDaysRemaining(promo.endDate);
                const isEnded = days !== null && days < 0;
                const isUrgent = days !== null && days <= 3 && days >= 0;

                const clientTestUrl = `/client/shops/${shop.id}?promo=true&promoId=${promo.id}&discount=${promo.discount}&startDate=${promo.startDate}&endDate=${promo.endDate}&title=${encodeURIComponent(promo.title)}`;

                return (
                  <div
                    key={promo.id}
                    className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-4 shadow-sm hover:border-violet-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isEnded ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                              Expirée
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          )}

                          {days !== null && !isEnded && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isUrgent
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              }`}
                            >
                              {days === 0 ? "Dernier jour !" : `Encore ${days}j`}
                            </span>
                          )}
                        </div>

                        {/* Discount Badge */}
                        <div className="px-2.5 py-1 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white font-black text-sm shadow-sm shrink-0">
                          -{promo.discount}%
                        </div>
                      </div>

                      {/* Title & Desc */}
                      <h4 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 leading-snug">
                        {promo.title}
                      </h4>
                      {promo.description && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                          {promo.description}
                        </p>
                      )}

                      {/* Dates */}
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-400">
                        <Calendar className="h-3 w-3" />
                        <span>Du {promo.startDate} au {promo.endDate}</span>
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                      <Link
                        href={clientTestUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Tester côté client
                        <ExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-70" />
                      </Link>

                      <button
                        onClick={() => handleDeletePromo(promo.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Supprimer la promotion"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── MODAL: CREATE PROMOTION ── */}
      <Modal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        title="Créer une nouvelle offre spéciale"
      >
        <form onSubmit={handleCreatePromo} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Titre de l&apos;offre *
            </label>
            <Input
              value={newPromo.title}
              onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
              placeholder="ex: Pack Marié VIP 💍, Remise Étudiant..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Description & Prestations incluses
            </label>
            <textarea
              value={newPromo.description}
              onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2.5 text-xs focus:ring-2 focus:ring-violet-500"
              placeholder="Détaillez ce qui est inclus dans cette formule..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Pourcentage de réduction (%) *
              </label>
              <div className="flex gap-1">
                {[10, 15, 20, 25, 30, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setNewPromo({ ...newPromo, discount: pct })}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all ${
                      newPromo.discount === pct
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200"
                    }`}
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>
            <Input
              type="number"
              min="1"
              max="100"
              value={newPromo.discount}
              onChange={(e) => setNewPromo({ ...newPromo, discount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Date de début *
              </label>
              <Input
                type="date"
                value={newPromo.startDate}
                onChange={(e) => setNewPromo({ ...newPromo, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Date de fin *
                </label>
                <button
                  type="button"
                  onClick={() => setNewPromo({ ...newPromo, endDate: getFutureDate(30) })}
                  className="text-[10px] text-violet-600 font-bold"
                >
                  +1 mois
                </button>
              </div>
              <Input
                type="date"
                value={newPromo.endDate}
                onChange={(e) => setNewPromo({ ...newPromo, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Live Preview Mockup */}
          <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 mb-2">
              <Eye className="h-3 w-3" />
              <span>Aperçu en direct côté client</span>
            </div>
            <div className="bg-white dark:bg-neutral-950 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800 shadow-sm flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 dark:bg-violet-950/40 px-1.5 py-0.5 rounded">
                    Offre Spéciale
                  </span>
                </div>
                <p className="font-extrabold text-xs text-neutral-900 dark:text-neutral-50 mt-1">
                  {newPromo.title || "Titre de votre offre"}
                </p>
                <p className="text-[11px] text-neutral-500 line-clamp-1">
                  {newPromo.description || "Description de la formule promotionnelle..."}
                </p>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white font-black text-xs shrink-0">
                -{newPromo.discount}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPromoModal(false)}
              disabled={savingPromo}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={savingPromo}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold"
            >
              {savingPromo ? "Publication en cours..." : "Publier l'offre 🚀"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
