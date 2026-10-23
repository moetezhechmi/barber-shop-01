"use client";

import * as React from "react";
import { Store, Pencil, Plus, Clock, Shield, ShieldAlert, Sparkles, Trash2, PlusCircle, Image as ImageIcon, Upload, Tag, Megaphone, Eye, Calendar, ExternalLink, Flame, CheckCircle, Percent, Gift, Bell, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { DAYS_OF_WEEK, cn } from "@/lib/utils";

interface ShopData {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  image: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  isAvailable: boolean;
  ownerId: string;
  images?: string[];
  amenities?: string[];
}

interface WorkingHour {
  id: string;
  barberId: string;
  shopId: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  barber: { id: string; userId: string } | null;
}

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.95z"/>
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
    <path d="M12.525.02c1.31-.03 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.21-.42-.45-.61-.7-.02 3.68-.01 7.36-.02 11.04-.1 1.72-.77 3.47-2.07 4.59-1.27 1.14-3.03 1.75-4.74 1.78-1.72.03-3.51-.48-4.82-1.57-1.37-1.12-2.18-2.91-2.29-4.67-.16-2.52 1.34-5.01 3.73-5.87.5-.18 1.04-.3 1.57-.36v4.13c-.4.07-.82.19-1.19.4-.87.49-1.34 1.53-1.13 2.53.16.82.81 1.48 1.62 1.64.97.21 2.05-.18 2.52-1.07.22-.4.29-.87.28-1.32-.01-4.08 0-8.15-.01-12.23.01-.15.01-.3 0-.45z"/>
  </svg>
);

const WifiIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
  </svg>
);

const CoffeeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
);

const GamepadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="15" y1="13" x2="15.01" y2="13" strokeWidth="3" />
    <line x1="18" y1="11" x2="18.01" y2="11" strokeWidth="3" />
    <rect x="2" y="6" width="20" height="12" rx="3" />
  </svg>
);

const AcIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 4a2 2 0 0 0-4 0v16a2 2 0 0 0 4 0" />
    <path d="M4 14a2 2 0 0 0 0-4h16a2 2 0 0 0 0 4" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const ParkingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
  </svg>
);

const AMENITIES_LIST = [
  { key: "wifi", label: "Wi-Fi Gratuit", icon: WifiIcon, color: "text-blue-600 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" },
  { key: "coffee", label: "Café & Boissons", icon: CoffeeIcon, color: "text-amber-700 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" },
  { key: "playstation", label: "PlayStation / Jeux", icon: GamepadIcon, color: "text-indigo-600 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20" },
  { key: "ac", label: "Climatiseur", icon: AcIcon, color: "text-sky-600 border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20" },
  { key: "parking", label: "Parking Privé", icon: ParkingIcon, color: "text-emerald-600 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" },
];

export default function OwnerShopPage() {
  const { toast } = useToast();
  const [shop, setShop] = React.useState<ShopData | null>(null);
  const [workingHours, setWorkingHours] = React.useState<WorkingHour[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);

  const [formData, setFormData] = React.useState<{
    name: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    facebook: string;
    instagram: string;
    tiktok: string;
    isAvailable: boolean;
    images: string[];
    amenities: string[];
  }>({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    isAvailable: true,
    images: [],
    amenities: [],
  });

  const [saving, setSaving] = React.useState(false);
  const [newImgUrl, setNewImgUrl] = React.useState("");

  function addGalleryImage() {
    if (!newImgUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, newImgUrl.trim()],
    }));
    setNewImgUrl("");
  }

  function removeGalleryImage(index: number) {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  function toggleAmenity(key: string) {
    setFormData((prev) => {
      const exists = prev.amenities.includes(key);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((k) => k !== key)
          : [...prev.amenities, key],
      };
    });
  }

  const [uploading, setUploading] = React.useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    const bodyFormData = new FormData();
    bodyFormData.append("file", file);
    
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: bodyFormData,
      });
      
      if (!res.ok) {
        throw new Error("Erreur de téléchargement");
      }
      
      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, data.url],
      }));
      toast("Image téléversée et ajoutée à la galerie !", "success");
    } catch (err) {
      toast("Erreur lors de l'upload de l'image", "error");
    } finally {
      setUploading(false);
    }
  }

  const [showHoursModal, setShowHoursModal] = React.useState(false);
  const [hoursForm, setHoursForm] = React.useState<
    { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }[]
  >([]);
  const [savingHours, setSavingHours] = React.useState(false);

  // Promotions State & Templates
  interface PromotionData {
    id: string;
    title: string;
    description: string | null;
    discount: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    imageUrl: string | null;
    createdAt: string;
  }
  
  const [promotions, setPromotions] = React.useState<PromotionData[]>([]);
  const [showPromoModal, setShowPromoModal] = React.useState(false);
  const [newPromo, setNewPromo] = React.useState({
    title: "",
    description: "",
    discount: 20,
    startDate: "",
    endDate: "",
    imageUrl: "",
  });
  const [savingPromo, setSavingPromo] = React.useState(false);
  const [promoUploading, setPromoUploading] = React.useState(false);
  const [promoFilter, setPromoFilter] = React.useState<"all" | "active" | "expired">("all");
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);

  interface PromotionTemplate {
    id: string;
    name: string;
    title: string;
    description: string;
    discount: number;
    durationDays: number;
    icon: string;
    badge: string;
    gradient: string;
  }

  const PROMO_TEMPLATES: PromotionTemplate[] = [
    {
      id: "mariage",
      name: "Pack Marié / Mariage 💍",
      title: "Pack Marié VIP 💍",
      description: "Coiffure de marié, taille & soin barbe d'exception, soin visage relaxant & finition au rasoir.",
      discount: 25,
      durationDays: 30,
      icon: "💍",
      badge: "Cérémonie & VIP",
      gradient: "from-amber-500 via-orange-500 to-rose-500",
    },
    {
      id: "etudiant",
      name: "Tarif Étudiant 🎓",
      title: "Offre Étudiants & Jeunes 🎓",
      description: "Coupe stylée + contours soignés pour lycéens et étudiants.",
      discount: 20,
      durationDays: 30,
      icon: "🎓",
      badge: "Populaire",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      id: "weekend",
      name: "Spécial Weekend ⚡",
      title: "Spécial Weekend Coupe + Barbe ⚡",
      description: "Profitez de notre formule complète coupe tendance et taille de barbe soignée.",
      discount: 15,
      durationDays: 7,
      icon: "⚡",
      badge: "Flash",
      gradient: "from-violet-600 to-purple-600",
    },
    {
      id: "fete",
      name: "Fêtes & Aïd 🌙",
      title: "Offre Spéciale Fêtes & Célébrations 🌙",
      description: "Préparez-vous pour les grandes occasions avec nos soins d'excellence.",
      discount: 30,
      durationDays: 14,
      icon: "🌙",
      badge: "Prestige",
      gradient: "from-emerald-500 to-teal-700",
    },
    {
      id: "pere-fils",
      name: "Duo Père & Fils 👑",
      title: "Formule Duo Père & Fils 👑",
      description: "Un moment complice chez votre barbier : 2 coupes complètes au tarif préférentiel.",
      discount: 25,
      durationDays: 30,
      icon: "👑",
      badge: "Duo & Famille",
      gradient: "from-amber-600 to-orange-600",
    },
    {
      id: "nouveau-client",
      name: "Nouveau Client 🎉",
      title: "Offre Découverte - Bienvenue 🎉",
      description: "Découvrez notre salon et profitez d'une remise exclusive sur votre première visite.",
      discount: 20,
      durationDays: 30,
      icon: "🎉",
      badge: "Nouveau",
      gradient: "from-rose-500 to-pink-600",
    },
  ];

  function getTodayDate() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function getFutureDate(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatPromoDate(dStr: string) {
    if (!dStr) return "";
    const clean = dStr.split("T")[0];
    try {
      return new Date(clean + "T00:00:00").toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return clean;
    }
  }

  function getDaysRemaining(endDateStr: string) {
    if (!endDateStr) return null;
    const clean = endDateStr.split("T")[0];
    const now = new Date();
    const end = new Date(clean + "T23:59:59");
    const diffMs = end.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  function applyPromoTemplate(template: PromotionTemplate) {
    const today = getTodayDate();
    const end = getFutureDate(template.durationDays);
    setNewPromo({
      title: template.title,
      description: template.description,
      discount: template.discount,
      startDate: today,
      endDate: end,
      imageUrl: "",
    });
    setSelectedTemplateId(template.id);
    setShowPromoModal(true);
  }

  function openNewPromoModal() {
    const today = getTodayDate();
    const end = getFutureDate(30);
    setNewPromo({
      title: "",
      description: "",
      discount: 20,
      startDate: today,
      endDate: end,
      imageUrl: "",
    });
    setSelectedTemplateId(null);
    setShowPromoModal(true);
  }

  const todayStr = getTodayDate();

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

  async function loadShop() {
    try {
      setLoading(true);
      setError(null);

      const [meRes, shopsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/shops"),
      ]);

      if (!meRes.ok || !shopsRes.ok) {
        throw new Error("Erreur lors du chargement des données");
      }

      const meData = await meRes.json();
      const shopsData = await shopsRes.json();

      const userShop = (shopsData.shops || []).find(
        (s: ShopData) => s.ownerId === meData.user.id
      );

      if (userShop) {
        setShop(userShop);
        setFormData({
          name: userShop.name || "",
          description: userShop.description || "",
          address: userShop.address || "",
          phone: userShop.phone || "",
          email: userShop.email || "",
          facebook: userShop.facebook || "",
          instagram: userShop.instagram || "",
          tiktok: userShop.tiktok || "",
          isAvailable: userShop.isAvailable ?? true,
          images: userShop.images || [],
          amenities: userShop.amenities || [],
        });

        const whRes = await fetch(`/api/shops/${userShop.id}/working-hours`);
        if (whRes.ok) {
          const whData = await whRes.json();
          setWorkingHours(whData.workingHours || []);
        }

        const promoRes = await fetch(`/api/shops/${userShop.id}/promotions`);
        if (promoRes.ok) {
          const promoData = await promoRes.json();
          setPromotions(promoData.promotions || []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadShop();
  }, []);

  async function handlePromoFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    const bodyFormData = new FormData();
    bodyFormData.append("file", file);
    
    setPromoUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: bodyFormData,
      });
      
      if (!res.ok) {
        throw new Error("Erreur de téléchargement");
      }
      
      const data = await res.json();
      setNewPromo((prev) => ({
        ...prev,
        imageUrl: data.url,
      }));
      toast("Image de promotion téléversée avec succès !", "success");
    } catch (err) {
      toast("Erreur lors de l'upload de l'image", "error");
    } finally {
      setPromoUploading(false);
    }
  }

  async function handleCreatePromotion() {
    if (!shop) return;
    if (!newPromo.title.trim() || !newPromo.startDate || !newPromo.endDate) {
      toast("Le titre, la date de début et de fin sont obligatoires", "error");
      return;
    }
    setSavingPromo(true);
    try {
      const res = await fetch(`/api/shops/${shop.id}/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPromo.title.trim(),
          description: newPromo.description.trim() || null,
          discount: Number(newPromo.discount),
          startDate: newPromo.startDate,
          endDate: newPromo.endDate,
          imageUrl: newPromo.imageUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur lors de la création");
      }

      const data = await res.json();
      setPromotions((prev) => [data.promotion, ...prev]);
      setShowPromoModal(false);
      setNewPromo({
        title: "",
        description: "",
        discount: 20,
        startDate: "",
        endDate: "",
        imageUrl: "",
      });
      setSelectedTemplateId(null);
      toast("Offre promotionnelle créée et envoyée aux clients ! 🎉", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur lors de la création",
        "error"
      );
    } finally {
      setSavingPromo(false);
    }
  }

  async function handleDeletePromotion(promoId: string) {
    if (!confirm("Voulez-vous vraiment supprimer cette promotion ?")) return;
    try {
      const res = await fetch(`/api/promotions/${promoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur lors de la suppression");
      }

      setPromotions((prev) => prev.filter((p) => p.id !== promoId));
      toast("Promotion supprimée avec succès", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur lors de la suppression",
        "error"
      );
    }
  }

  async function handleCreateShop() {
    setSaving(true);
    try {
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          address: formData.address,
          phone: formData.phone || null,
          email: formData.email || null,
          facebook: formData.facebook || null,
          instagram: formData.instagram || null,
          tiktok: formData.tiktok || null,
          isAvailable: formData.isAvailable,
          images: formData.images,
          amenities: formData.amenities,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur lors de la création");
      }

      const data = await res.json();
      setShop(data.shop);
      setShowCreateModal(false);
      toast("Salon créé avec succès", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur lors de la création",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateShop() {
    if (!shop) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/shops/${shop.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          address: formData.address,
          phone: formData.phone || null,
          email: formData.email || null,
          facebook: formData.facebook || null,
          instagram: formData.instagram || null,
          tiktok: formData.tiktok || null,
          isAvailable: formData.isAvailable,
          images: formData.images,
          amenities: formData.amenities,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur lors de la modification");
      }

      const data = await res.json();
      setShop(data.shop);
      setShowEditModal(false);
      toast("Salon mis à jour avec succès", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur lors de la modification",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  function openHoursModal() {
    if (!shop) return;
    const initial = DAYS_OF_WEEK.map((_, i) => {
      const existing = workingHours.find((w) => w.dayOfWeek === (i + 1) % 7);
      return {
        dayOfWeek: (i + 1) % 7,
        startTime: existing?.startTime ?? "09:00",
        endTime: existing?.endTime ?? "18:00",
        isAvailable: existing?.isAvailable ?? false,
      };
    });
    setHoursForm(initial);
    setShowHoursModal(true);
  }

  async function saveHours() {
    if (!shop) return;
    setSavingHours(true);
    try {
      const res = await fetch(`/api/shops/${shop.id}/working-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workingHours: hoursForm }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur lors de la sauvegarde");
      }
      const whRes = await fetch(`/api/shops/${shop.id}/working-hours`);
      if (whRes.ok) {
        const whData = await whRes.json();
        setWorkingHours(whData.workingHours || []);
      }
      setShowHoursModal(false);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde",
        "error"
      );
    } finally {
      setSavingHours(false);
    }
  }

  function openCreateModal() {
    setFormData({
      name: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      facebook: "",
      instagram: "",
      tiktok: "",
      isAvailable: true,
      images: [],
      amenities: [],
    });
    setShowCreateModal(true);
  }

  function openEditModal() {
    if (!shop) return;
    setFormData({
      name: shop.name || "",
      description: shop.description || "",
      address: shop.address || "",
      phone: shop.phone || "",
      email: shop.email || "",
      facebook: shop.facebook || "",
      instagram: shop.instagram || "",
      tiktok: shop.tiktok || "",
      isAvailable: shop.isAvailable ?? true,
      images: shop.images || [],
      amenities: shop.amenities || [],
    });
    setShowEditModal(true);
  }

  if (loading) {
    return <div className="text-center text-neutral-500 py-20">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-20">
        <p className="text-lg font-semibold">Erreur</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const hoursByDay = DAYS_OF_WEEK.map((dayLabel, index) => {
    const hours = workingHours.filter((wh) => wh.dayOfWeek === index);
    return { dayLabel, dayIndex: index, hours };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            Mon Salon <Sparkles className="h-6 w-6 text-violet-500" />
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Gérez les informations, les réseaux sociaux et la disponibilité de votre établissement.
          </p>
        </div>
        {!shop && (
          <Button onClick={openCreateModal} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Créer un salon
          </Button>
        )}
      </div>

      {!shop ? (
        <Card className="border border-neutral-200 dark:border-neutral-800">
          <CardContent className="py-20 text-center">
            <Store className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Aucun salon
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">
              Vous n&apos;avez pas encore créé de salon. Créez-en un pour commencer.
            </p>
            <Button onClick={openCreateModal} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              Créer mon salon
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl font-bold">{shop.name}</CardTitle>
                {shop.isAvailable ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Shield className="h-3 w-3" /> Disponible aux réservations
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <ShieldAlert className="h-3 w-3" /> Réservations désactivées
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={openEditModal} className="rounded-xl">
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {shop.description && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                    Description
                  </p>
                  <p className="text-neutral-900 dark:text-neutral-50 text-sm leading-relaxed">
                    {shop.description}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-neutral-100 dark:border-neutral-800/80 pt-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                    Adresse
                  </p>
                  <p className="text-neutral-900 dark:text-neutral-50 text-sm">
                    {shop.address}
                  </p>
                </div>
                {shop.phone && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                      Téléphone
                    </p>
                    <p className="text-neutral-900 dark:text-neutral-50 text-sm font-mono">
                      {shop.phone}
                    </p>
                  </div>
                )}
                {shop.email && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                      Email
                    </p>
                    <p className="text-neutral-900 dark:text-neutral-50 text-sm">
                      {shop.email}
                    </p>
                  </div>
                )}
              </div>

              {/* Social Media Links Section */}
              <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                  Réseaux Sociaux
                </p>
                <div className="flex flex-wrap gap-4">
                  {shop.facebook ? (
                    <a
                      href={shop.facebook.startsWith("http") ? shop.facebook : `https://${shop.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-blue-500/10 bg-blue-50/5 text-blue-500 hover:bg-blue-500/10 transition-colors text-sm font-semibold shadow-sm"
                    >
                      <FacebookIcon className="h-4 w-4" />
                      <span>Facebook</span>
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400 dark:text-neutral-600 border border-dashed border-neutral-200 dark:border-neutral-800 px-4 py-2.5 rounded-2xl">
                      Facebook non configuré
                    </span>
                  )}

                  {shop.instagram ? (
                    <a
                      href={shop.instagram.startsWith("http") ? shop.instagram : `https://${shop.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-pink-500/10 bg-pink-50/5 text-pink-500 hover:bg-pink-500/10 transition-colors text-sm font-semibold shadow-sm"
                    >
                      <InstagramIcon className="h-4 w-4" />
                      <span>Instagram</span>
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400 dark:text-neutral-600 border border-dashed border-neutral-200 dark:border-neutral-800 px-4 py-2.5 rounded-2xl">
                      Instagram non configuré
                    </span>
                  )}

                  {shop.tiktok ? (
                    <a
                      href={shop.tiktok.startsWith("http") ? shop.tiktok : `https://${shop.tiktok}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-neutral-700 dark:border-neutral-300/10 bg-neutral-900/5 text-neutral-900 dark:text-white hover:bg-neutral-900/10 transition-colors text-sm font-semibold shadow-sm"
                    >
                      <TikTokIcon className="h-4 w-4" />
                      <span>TikTok</span>
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400 dark:text-neutral-600 border border-dashed border-neutral-200 dark:border-neutral-800 px-4 py-2.5 rounded-2xl">
                      TikTok non configuré
                    </span>
                  )}
                </div>
              </div>

              {/* Amenities Section */}
              <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                  Équipements & Options
                </p>
                {(!shop.amenities || shop.amenities.length === 0) ? (
                  <span className="text-xs text-neutral-400 dark:text-neutral-600 border border-dashed border-neutral-200 dark:border-neutral-800 px-4 py-2.5 rounded-2xl inline-block">
                    Aucune option configurée (Café, PlayStation, Climatisation...)
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {AMENITIES_LIST.map((item) => {
                      const hasAmenity = shop.amenities?.includes(item.key);
                      if (!hasAmenity) return null;
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.key}
                          className={cn(
                            "flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold shadow-sm",
                            item.color
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Shop Image Gallery Section */}
              <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                  Galerie de photos du salon
                </p>
                {(!shop.images || shop.images.length === 0) ? (
                  <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center">
                    <ImageIcon className="h-8 w-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                      Aucune photo dans la galerie. Ajoutez-en dans les paramètres du salon !
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {shop.images.map((imgUrl, i) => (
                      <div
                        key={i}
                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/80 bg-neutral-100 dark:bg-neutral-900 shadow-sm"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt={`Photo salon ${i + 1}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 dark:border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <CardTitle className="text-lg font-bold">Horaires d&apos;ouverture</CardTitle>
              <Button variant="outline" size="sm" onClick={openHoursModal} className="rounded-xl">
                <Clock className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              {hoursByDay.length === 0 ||
              hoursByDay.every((d) => d.hours.length === 0) ? (
                <p className="text-neutral-500 dark:text-neutral-400 text-sm py-8 text-center">
                  Aucun horaire défini. Cliquez sur &quot;Modifier&quot; pour configurer.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800">
                        <th className="text-left py-3 px-4 font-medium text-neutral-500 dark:text-neutral-400">
                          Jour
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-500 dark:text-neutral-400">
                          Ouverture
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-500 dark:text-neutral-400">
                          Fermeture
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {hoursByDay.map(({ dayLabel, dayIndex, hours }) => {
                        const first = hours[0];
                        return (
                          <tr
                            key={dayIndex}
                            className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/25 transition-colors"
                          >
                            <td className="py-3 px-4 font-medium text-neutral-900 dark:text-neutral-50">
                              {dayLabel}
                            </td>
                            <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                              {first && first.isAvailable
                                ? first.startTime.slice(0, 5)
                                : "\u2014"}
                            </td>
                            <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                              {first && first.isAvailable
                                ? first.endTime.slice(0, 5)
                                : "\u2014"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── ENHANCED PROMOTIONS & PACKS MANAGEMENT ── */}
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm mt-8 overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white shadow-md">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                      Offres & Promotions
                    </CardTitle>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      <Sparkles className="h-3 w-3" />
                      {promotions.length} offre{promotions.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Proposez des packs spéciaux (Pack Marié, Étudiants, Fêtes) pour attirer et fidéliser vos clients.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/client/shops/${shop.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold shadow-sm transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Voir côté client
                </a>
                <Button
                  onClick={openNewPromoModal}
                  size="sm"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-md text-xs font-bold px-4"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Nouvelle Offre
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Quick Template Launcher */}
              <div className="rounded-2xl p-4 bg-gradient-to-r from-violet-50/60 via-indigo-50/40 to-amber-50/60 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-850 border border-violet-100/80 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                      Créer en 1 clic à partir de nos modèles populaires :
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-medium hidden sm:inline">
                    Prêt à l'emploi
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {PROMO_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => applyPromoTemplate(tmpl)}
                      className="group relative flex flex-col items-start p-3 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 hover:border-violet-500 dark:hover:border-violet-500 hover:shadow-md transition-all active:scale-95 text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-xl">{tmpl.icon}</span>
                        <span className="text-[10px] font-black bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 px-1.5 py-0.5 rounded-md">
                          -{tmpl.discount}%
                        </span>
                      </div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-violet-600 transition-colors">
                        {tmpl.name}
                      </p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-0.5">
                        {tmpl.durationDays} jours
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Tabs */}
              {promotions.length > 0 && (
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <div className="flex items-center gap-1.5">
                    {[
                      { key: "all", label: "Toutes", count: promotions.length },
                      { key: "active", label: "En cours", count: activePromotions.length },
                      { key: "expired", label: "Expirées", count: expiredPromotions.length },
                    ].map((tabItem) => (
                      <button
                        key={tabItem.key}
                        onClick={() => setPromoFilter(tabItem.key as any)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                          promoFilter === tabItem.key
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-850"
                        )}
                      >
                        <span>{tabItem.label}</span>
                        <span className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px]",
                          promoFilter === tabItem.key
                            ? "bg-white/20 dark:bg-neutral-900/20"
                            : "bg-neutral-200 dark:bg-neutral-800"
                        )}>
                          {tabItem.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-neutral-400 dark:text-neutral-500 hidden sm:block">
                    Diffusé automatiquement aux clients
                  </p>
                </div>
              )}

              {/* Promotions List */}
              {promotions.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto mb-3 shadow-inner">
                    <Tag className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                    Aucune offre promotionnelle pour le moment
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
                    Créez votre première offre (ex: Pack Marié VIP, Remise Étudiants ou Spécial Weekend) pour attirer de nouveaux clients et booster vos réservations.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      onClick={() => applyPromoTemplate(PROMO_TEMPLATES[0])}
                      className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white rounded-xl shadow-md font-bold text-xs"
                    >
                      💍 Lancer le Pack Marié (-25%)
                    </Button>
                    <Button
                      onClick={openNewPromoModal}
                      variant="outline"
                      className="rounded-xl font-bold text-xs"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Offre personnalisée
                    </Button>
                  </div>
                </div>
              ) : filteredPromotions.length === 0 ? (
                <div className="text-center py-10 text-neutral-500 dark:text-neutral-400">
                  <p className="text-sm font-semibold">Aucune promotion dans cette catégorie</p>
                  <button
                    onClick={() => setPromoFilter("all")}
                    className="text-xs text-violet-600 dark:text-violet-400 underline mt-1"
                  >
                    Voir toutes les promotions ({promotions.length})
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPromotions.map((promo) => {
                    const days = getDaysRemaining(promo.endDate);
                    const isEnded = days !== null && days < 0;
                    const isUpcoming = promo.startDate && promo.startDate > todayStr;
                    const isActive = !isEnded && !isUpcoming && promo.isActive !== false;

                    return (
                      <div
                        key={promo.id}
                        className={cn(
                          "group relative flex flex-col rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden bg-white dark:bg-neutral-950",
                          isActive
                            ? "border-amber-200/80 dark:border-amber-900/40 hover:shadow-lg hover:-translate-y-0.5"
                            : isUpcoming
                            ? "border-blue-200/80 dark:border-blue-900/40 hover:shadow-md"
                            : "border-neutral-200/60 dark:border-neutral-800 opacity-75 hover:opacity-100"
                        )}
                      >
                        {/* Top Gradient Banner with Status */}
                        <div className={cn(
                          "relative p-4 text-white flex items-center justify-between",
                          isActive
                            ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500"
                            : isUpcoming
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                            : "bg-neutral-700"
                        )}>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tight">
                              -{promo.discount}%
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                              Remise
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-emerald-700 shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                {days !== null && days >= 0
                                  ? days === 0
                                    ? "Dernier jour !"
                                    : `Reste ${days}j`
                                  : "En cours"}
                              </span>
                            ) : isUpcoming ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-blue-700 shadow-sm">
                                <Clock className="h-3 w-3" />
                                À venir
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-900/40 text-neutral-300">
                                Terminée
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h4 className="font-extrabold text-neutral-900 dark:text-neutral-50 text-base leading-snug">
                              {promo.title}
                            </h4>
                            {promo.description && (
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed line-clamp-2">
                                {promo.description}
                              </p>
                            )}
                          </div>

                          <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                            {/* Dates details */}
                            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                                <span>{formatPromoDate(promo.startDate)}</span>
                                <span>→</span>
                                <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                                  {formatPromoDate(promo.endDate)}
                                </span>
                              </span>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <a
                                href={`/client/shops/${shop.id}?promo=true&discount=${promo.discount}&startDate=${promo.startDate}&endDate=${promo.endDate}&title=${encodeURIComponent(promo.title)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Tester côté client ↗
                              </a>

                              <button
                                type="button"
                                onClick={() => handleDeletePromotion(promo.id)}
                                className="flex h-8 px-2.5 items-center gap-1 text-xs font-semibold rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                                title="Supprimer la promotion"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Supprimer</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Shop Modal */}
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Modifier le salon"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateShop();
              }}
              className="space-y-4 max-h-[80vh] overflow-y-auto px-1 py-1"
            >
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nom du salon
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Nom du salon"
                  className="rounded-xl"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Disponibilité du salon
                </label>
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
                  <input
                    type="checkbox"
                    id="isAvailableEdit"
                    checked={formData.isAvailable}
                    onChange={(e) =>
                      setFormData({ ...formData, isAvailable: e.target.checked })
                    }
                    className="h-4.5 w-4.5 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
                  />
                  <label htmlFor="isAvailableEdit" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                    Disponible pour les réservations en ligne
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Description du salon"
                  className="flex h-20 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Adresse
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                  placeholder="Adresse du salon"
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Téléphone
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Téléphone"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Email"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Social Media Link Inputs */}
              <div className="border-t border-neutral-200 dark:border-neutral-800/80 pt-4 mt-2 space-y-3">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Réseaux Sociaux
                </p>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mb-1 ml-0.5">
                    <FacebookIcon className="h-3.5 w-3.5 text-blue-500" /> Lien Facebook
                  </label>
                  <Input
                    value={formData.facebook}
                    onChange={(e) =>
                      setFormData({ ...formData, facebook: e.target.value })
                    }
                    placeholder="facebook.com/mon-salon"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mb-1 ml-0.5">
                    <InstagramIcon className="h-3.5 w-3.5 text-pink-500" /> Lien Instagram
                  </label>
                  <Input
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram: e.target.value })
                    }
                    placeholder="instagram.com/mon-salon"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mb-1 ml-0.5">
                    <TikTokIcon className="h-3.5 w-3.5 text-neutral-900 dark:text-white" /> Lien TikTok
                  </label>
                  <Input
                    value={formData.tiktok}
                    onChange={(e) =>
                      setFormData({ ...formData, tiktok: e.target.value })
                    }
                    placeholder="tiktok.com/@mon-salon"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Edit Amenities (Options) Selector */}
              <div className="border-t border-neutral-200 dark:border-neutral-800/80 pt-4 mt-2">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                  Équipements & Options
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-3">
                  Sélectionnez les équipements disponibles dans votre salon pour attirer plus de clients.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AMENITIES_LIST.map((item) => {
                    const isSelected = formData.amenities.includes(item.key);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleAmenity(item.key)}
                        className={cn(
                          "flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all duration-200 text-left",
                          isSelected
                            ? "border-violet-600 bg-violet-50 text-violet-600 dark:border-violet-400 dark:bg-violet-950/20 dark:text-violet-400 shadow-sm"
                            : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900"
                        )}
                      >
                        <div className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-xl border shrink-0",
                          isSelected
                            ? "border-violet-300 bg-white dark:border-violet-800 dark:bg-neutral-900"
                            : "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Edit Shop Gallery Manager */}
              <div className="border-t border-neutral-200 dark:border-neutral-800/80 pt-4 mt-2">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                  Galerie de photos
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-3">
                  Ajoutez des photos de votre salon. Les clients adorent voir le cadre avant de réserver !
                </p>
                
                {/* Visual File Uploader Zone */}
                <div className="mb-4">
                  <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl cursor-pointer bg-neutral-50/50 hover:bg-neutral-50 dark:bg-neutral-900/30 dark:hover:bg-neutral-900/50 transition-all group overflow-hidden">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
                        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 animate-pulse">
                          Téléversement en cours...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center px-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-100 dark:border-violet-900 group-hover:scale-110 transition-transform">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                            Cliquez pour téléverser une photo
                          </p>
                          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                            PNG, JPG, JPEG ou WEBP (Max. 5Mo)
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                {/* Manual URL input fallback */}
                <div className="space-y-1.5 mb-2">
                  <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                    Ou ajouter par lien URL :
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={newImgUrl}
                      onChange={(e) => setNewImgUrl(e.target.value)}
                      placeholder="https://exemple.com/photo-salon.jpg"
                      className="rounded-xl flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addGalleryImage}
                      className="bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 rounded-xl"
                    >
                      Ajouter
                    </Button>
                  </div>
                </div>

                {/* Preview and delete gallery URLs */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {formData.images.map((url, index) => (
                      <div
                        key={index}
                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-900"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Miniature"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-red-600/90 text-white shadow hover:bg-red-500 transition-colors"
                          title="Supprimer la photo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl"
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saving} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-md">
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}

      {/* Working hours modal */}
      {showHoursModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-950 overflow-hidden flex flex-col max-h-[90vh]">
            <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-50 shrink-0">
              Modifier les horaires d&apos;ouverture
            </h2>
            <div className="space-y-3 overflow-y-auto pr-1 flex-1 py-1">
              {DAYS_OF_WEEK.map((dayLabel, i) => {
                const fh = hoursForm.find((h) => h.dayOfWeek === (i + 1) % 7);
                if (!fh) return null;
                return (
                  <div
                    key={fh.dayOfWeek}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors"
                  >
                    <label className="flex items-center gap-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={fh.isAvailable}
                        onChange={(e) => {
                          setHoursForm((prev) =>
                            prev.map((h) =>
                              h.dayOfWeek === fh.dayOfWeek
                                ? { ...h, isAvailable: e.target.checked }
                                : h
                            )
                          );
                        }}
                        className="h-4.5 w-4.5 rounded border-neutral-300 text-violet-600 focus:ring-violet-500 dark:border-neutral-700 dark:bg-neutral-800"
                      />
                      {dayLabel}
                    </label>
                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                      <input
                        type="time"
                        value={fh.startTime}
                        disabled={!fh.isAvailable}
                        onChange={(e) => {
                          setHoursForm((prev) =>
                            prev.map((h) =>
                              h.dayOfWeek === fh.dayOfWeek
                                ? { ...h, startTime: e.target.value }
                                : h
                            )
                          );
                        }}
                        className="flex-1 sm:flex-initial rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                      <span className="text-neutral-400 font-semibold">&ndash;</span>
                      <input
                        type="time"
                        value={fh.endTime}
                        disabled={!fh.isAvailable}
                        onChange={(e) => {
                          setHoursForm((prev) =>
                            prev.map((h) =>
                              h.dayOfWeek === fh.dayOfWeek
                                ? { ...h, endTime: e.target.value }
                                : h
                            )
                          );
                        }}
                        className="flex-1 sm:flex-initial rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowHoursModal(false)}
                disabled={savingHours}
                className="rounded-xl"
              >
                Annuler
              </Button>
              <Button onClick={saveHours} disabled={savingHours} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-md">
                {savingHours ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Shop Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un salon"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateShop();
          }}
          className="space-y-4 max-h-[80vh] overflow-y-auto px-1 py-1"
        >
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Nom du salon
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Nom du salon"
              className="rounded-xl"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Disponibilité du salon
            </label>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
              <input
                type="checkbox"
                id="isAvailableCreate"
                checked={formData.isAvailable}
                onChange={(e) =>
                  setFormData({ ...formData, isAvailable: e.target.checked })
                }
                className="h-4.5 w-4.5 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
              />
              <label htmlFor="isAvailableCreate" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                Disponible pour les réservations en ligne dès la création
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Description du salon"
              className="flex h-20 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Adresse
            </label>
            <Input
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
              placeholder="Adresse du salon"
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Téléphone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Téléphone"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Email"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Social Media Link Inputs for Create */}
          <div className="border-t border-neutral-200 dark:border-neutral-800/80 pt-4 mt-2 space-y-3">
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Réseaux Sociaux
            </p>
            <div>
              <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mb-1 ml-0.5">
                <FacebookIcon className="h-3.5 w-3.5 text-blue-500" /> Lien Facebook
              </label>
              <Input
                value={formData.facebook}
                onChange={(e) =>
                  setFormData({ ...formData, facebook: e.target.value })
                }
                placeholder="facebook.com/mon-salon"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mb-1 ml-0.5">
                <InstagramIcon className="h-3.5 w-3.5 text-pink-500" /> Lien Instagram
              </label>
              <Input
                value={formData.instagram}
                onChange={(e) =>
                  setFormData({ ...formData, instagram: e.target.value })
                }
                placeholder="instagram.com/mon-salon"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mb-1 ml-0.5">
                <TikTokIcon className="h-3.5 w-3.5 text-neutral-900 dark:text-white" /> Lien TikTok
              </label>
              <Input
                value={formData.tiktok}
                onChange={(e) =>
                  setFormData({ ...formData, tiktok: e.target.value })
                }
                placeholder="tiktok.com/@mon-salon"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Create Amenities Selector */}
          <div className="border-t border-neutral-200 dark:border-neutral-800/80 pt-4 mt-2">
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2">
              Équipements & Options
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-3">
              Sélectionnez les équipements disponibles dans votre salon dès sa création.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AMENITIES_LIST.map((item) => {
                const isSelected = formData.amenities.includes(item.key);
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleAmenity(item.key)}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all duration-200 text-left",
                      isSelected
                        ? "border-violet-600 bg-violet-50 text-violet-600 dark:border-violet-400 dark:bg-violet-950/20 dark:text-violet-400 shadow-sm"
                        : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900"
                    )}
                  >
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-xl border shrink-0",
                      isSelected
                        ? "border-violet-300 bg-white dark:border-violet-800 dark:bg-neutral-900"
                        : "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create Shop Gallery Manager */}
          <div className="border-t border-neutral-200 dark:border-neutral-800/80 pt-4 mt-2">
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2">
              Galerie de photos
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-3">
              Ajoutez des photos de votre salon pour séduire vos futurs clients !
            </p>
            
            {/* Visual File Uploader Zone */}
            <div className="mb-4">
              <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl cursor-pointer bg-neutral-50/50 hover:bg-neutral-50 dark:bg-neutral-900/30 dark:hover:bg-neutral-900/50 transition-all group overflow-hidden">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 animate-pulse">
                      Téléversement en cours...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-100 dark:border-violet-900 group-hover:scale-110 transition-transform">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Cliquez pour téléverser une photo
                      </p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                        PNG, JPG, JPEG ou WEBP (Max. 5Mo)
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Manual URL input fallback */}
            <div className="space-y-1.5 mb-2">
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                Ou ajouter par lien URL :
              </label>
              <div className="flex gap-2">
                <Input
                  value={newImgUrl}
                  onChange={(e) => setNewImgUrl(e.target.value)}
                  placeholder="https://exemple.com/photo-salon.jpg"
                  className="rounded-xl flex-1"
                />
                <Button
                  type="button"
                  onClick={addGalleryImage}
                  className="bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 rounded-xl"
                >
                  Ajouter
                </Button>
              </div>
            </div>

            {/* Preview and delete gallery URLs */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {formData.images.map((url, index) => (
                  <div
                    key={index}
                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-900"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Miniature"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-red-600/90 text-white shadow hover:bg-red-500 transition-colors"
                      title="Supprimer la photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-md">
              {saving ? "Création..." : "Créer le salon"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── SUPERCHARGED CREATE PROMOTION MODAL ── */}
      <Modal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        title="Créer une offre promotionnelle"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreatePromotion();
          }}
          className="space-y-5 max-h-[85vh] overflow-y-auto px-1 py-1"
        >
          {/* Real-time broadcast notice */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200/80 dark:border-violet-900/50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm mt-0.5">
              <Bell className="h-4 w-4" />
            </div>
            <div className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <span className="font-bold text-violet-900 dark:text-violet-200 block">
                Diffusion instantanée aux clients
              </span>
              Dès validation, une notification sonore et visuelle sera envoyée à tous les clients inscrits. L'offre sera visible avec prix barrés automatiques sur votre page salon.
            </div>
          </div>

          {/* Preset Template Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Modèles d'offres en 1 clic :
              </label>
              {selectedTemplateId && (
                <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400">
                  Modèle sélectionné ✓
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROMO_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      setNewPromo((prev) => ({
                        ...prev,
                        title: tmpl.title,
                        description: tmpl.description,
                        discount: tmpl.discount,
                        startDate: getTodayDate(),
                        endDate: getFutureDate(tmpl.durationDays),
                      }));
                    }}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs",
                      isSelected
                        ? "border-violet-600 bg-violet-50 dark:bg-violet-950/30 text-violet-900 dark:text-violet-100 ring-2 ring-violet-500/30 shadow-sm"
                        : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850"
                    )}
                  >
                    <span className="text-lg shrink-0">{tmpl.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{tmpl.name}</p>
                      <span className="text-[10px] font-black text-red-600 dark:text-red-400">
                        -{tmpl.discount}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Titre de l&apos;offre *
            </label>
            <Input
              value={newPromo.title}
              onChange={(e) => {
                setSelectedTemplateId(null);
                setNewPromo({ ...newPromo, title: e.target.value });
              }}
              required
              placeholder="Ex: Pack Marié VIP 💍, Spécial Weekend, Remise Étudiants..."
              className="rounded-xl font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Description & Prestations incluses
            </label>
            <textarea
              value={newPromo.description}
              onChange={(e) =>
                setNewPromo({ ...newPromo, description: e.target.value })
              }
              rows={2}
              placeholder="Ex: Coupe soignée, soin barbe complet, massage & finition vapeur. Valable sur réservation."
              className="flex w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 dark:border-neutral-800 dark:bg-neutral-950 dark:placeholder:text-neutral-500 resize-none font-medium"
            />
          </div>

          {/* Discount Selector with Quick Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Pourcentage de remise (%) *
              </label>
              <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md">
                -{newPromo.discount}%
              </span>
            </div>

            {/* Quick discount buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[10, 15, 20, 25, 30, 50].map((dVal) => (
                <button
                  key={dVal}
                  type="button"
                  onClick={() => setNewPromo((p) => ({ ...p, discount: dVal }))}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    newPromo.discount === dVal
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                  )}
                >
                  -{dVal}%
                </button>
              ))}
              <div className="w-24">
                <Input
                  type="number"
                  value={newPromo.discount}
                  onChange={(e) =>
                    setNewPromo({ ...newPromo, discount: Number(e.target.value) })
                  }
                  required
                  min={1}
                  max={100}
                  className="rounded-xl h-8 text-xs font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* Validity Period with Quick Duration Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Période de validité *
              </label>
              <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                <span>Raccourcis :</span>
                {[
                  { label: "3 jours (Flash)", days: 3 },
                  { label: "1 sem.", days: 7 },
                  { label: "14 jours", days: 14 },
                  { label: "30 jours", days: 30 },
                ].map((dur) => (
                  <button
                    key={dur.days}
                    type="button"
                    onClick={() => {
                      const today = getTodayDate();
                      setNewPromo((p) => ({
                        ...p,
                        startDate: today,
                        endDate: getFutureDate(dur.days),
                      }));
                    }}
                    className="px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Date de début :
                </label>
                <Input
                  type="date"
                  value={newPromo.startDate}
                  onChange={(e) =>
                    setNewPromo({ ...newPromo, startDate: e.target.value })
                  }
                  required
                  className="rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Date de fin :
                </label>
                <Input
                  type="date"
                  value={newPromo.endDate}
                  onChange={(e) =>
                    setNewPromo({ ...newPromo, endDate: e.target.value })
                  }
                  required
                  className="rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Optional Promo Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Image promotionnelle (Optionnelle)
            </label>
            <label className="relative flex items-center justify-center w-full h-11 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl cursor-pointer bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-850 transition-all overflow-hidden">
              <input
                type="file"
                accept="image/*"
                onChange={handlePromoFileUpload}
                disabled={promoUploading}
                className="hidden"
              />
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                {promoUploading ? (
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-violet-500" />
                )}
                {newPromo.imageUrl ? "Image chargée ! ✅" : "Télécharger une photo pour l'offre"}
              </span>
            </label>
            {newPromo.imageUrl && (
              <div className="relative mt-2 aspect-video w-32 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={newPromo.imageUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setNewPromo({ ...newPromo, imageUrl: "" })}
                  className="absolute top-1 right-1 h-5 w-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* ── LIVE CLIENT PREVIEW (Aperçu temps réel) ── */}
          <div className="rounded-2xl p-4 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-violet-500" />
                Aperçu de ce que verront vos clients :
              </p>
              <span className="text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-2 py-0.5 rounded-full">
                Live Preview
              </span>
            </div>

            {/* Mockup Card */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-4 text-white flex items-center gap-3 shadow-md relative overflow-hidden">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                <span className="text-xl font-black">-{newPromo.discount || 20}%</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-black text-sm tracking-tight truncate">
                    {newPromo.title.trim() || "Titre de votre offre..."}
                  </p>
                  <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Offre
                  </span>
                </div>
                <p className="text-xs text-white/90 mt-0.5 line-clamp-1">
                  {newPromo.description.trim() || "Description détaillée des prestations incluses..."}
                </p>
                <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1 font-medium">
                  Jusqu'au {newPromo.endDate ? formatPromoDate(newPromo.endDate) : "Date de fin"}
                </p>
              </div>
              <div className="shrink-0 rounded-xl px-4 py-2 text-xs font-black shadow-md bg-white text-orange-600 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Profiter
              </div>
            </div>

            {/* Live calculation example with crossed-out price */}
            <div className="flex items-center justify-between bg-white dark:bg-neutral-950 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800 text-xs">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                Effet sur les tarifs (ex: Prestation 25.00 TND) :
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400 line-through">25.00 TND</span>
                <span className="font-black text-red-600 text-sm">
                  {(25 * (1 - (newPromo.discount || 20) / 100)).toFixed(2)} TND
                </span>
                <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">
                  -{newPromo.discount || 20}%
                </span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPromoModal(false)}
              className="rounded-xl text-xs font-bold"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={savingPromo}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-md text-xs font-bold px-5"
            >
              {savingPromo ? "Diffusion en cours..." : "Diffuser la promotion aux clients 🎉"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
