"use client";

import * as React from "react";
import { Store, Pencil, Plus, Clock, Shield, ShieldAlert, Sparkles, Trash2, PlusCircle, Image as ImageIcon, Upload } from "lucide-react";
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
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-blue-500/10 bg-blue-500/5 text-blue-500 hover:bg-blue-500/10 transition-colors text-sm font-semibold shadow-sm"
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
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-pink-500/10 bg-pink-500/5 text-pink-500 hover:bg-pink-500/10 transition-colors text-sm font-semibold shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-50">
              Modifier les horaires d&apos;ouverture
            </h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {DAYS_OF_WEEK.map((dayLabel, i) => {
                const fh = hoursForm.find((h) => h.dayOfWeek === (i + 1) % 7);
                if (!fh) return null;
                return (
                  <div
                    key={fh.dayOfWeek}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors"
                  >
                    <label className="flex items-center gap-2.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
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
                    <div className="flex items-center gap-2">
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
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50"
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
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
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
              {saving ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
