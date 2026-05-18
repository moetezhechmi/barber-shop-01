"use client";

import * as React from "react";
import { Users, Check, X, Plus, UserCheck, UserX, Copy, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone: string | null;
}

interface Barber {
  id: string;
  userId: string;
  shopId: string;
  isApproved: boolean;
  bio: string | null;
  user: UserInfo;
  shop: { id: string; name: string };
}

interface Appointment {
  id: string;
  barberId: string;
  status: string;
  service: { price: number };
}

interface Shop {
  id: string;
  name: string;
  ownerId: string;
}

export default function OwnerBarbersPage() {
  const { toast } = useToast();
  const [barbers, setBarbers] = React.useState<Barber[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [shop, setShop] = React.useState<Shop | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [createdCredentials, setCreatedCredentials] = React.useState<{
    name: string;
    email: string;
    password?: string;
    phone: string;
    whatsappUrl: string;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [copiedEmail, setCopiedEmail] = React.useState(false);
  const [copiedPassword, setCopiedPassword] = React.useState(false);

  const handleCopy = (text: string, type: "email" | "password") => {
    navigator.clipboard.writeText(text);
    if (type === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
    toast("Copié dans le presse-papiers !", "success");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  async function loadData() {
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
        (s: Shop) => s.ownerId === meData.user.id
      );

      if (userShop) {
        setShop(userShop);

        const [barbersRes, apptRes] = await Promise.all([
          fetch(`/api/barbers?shopId=${userShop.id}`),
          fetch("/api/appointments")
        ]);
        
        if (barbersRes.ok) {
          const barbersData = await barbersRes.json();
          setBarbers(barbersData.barbers || []);
        }
        
        if (apptRes.ok) {
          const apptData = await apptRes.json();
          setAppointments(apptData.appointments || []);
        }
      } else {
        setShop(null);
        setBarbers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadData();
  }, []);

  async function handleApprove(barberId: string) {
    try {
      const res = await fetch(`/api/barbers/${barberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur lors de l'approbation");
      }

      setBarbers((prev) =>
        prev.map((b) => (b.id === barberId ? { ...b, isApproved: true } : b))
      );
      toast("Barbier approuvé avec succès", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur lors de l'approbation",
        "error"
      );
    }
  }

  async function handleReject(barberId: string) {
    try {
      const res = await fetch(`/api/barbers/${barberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: false }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur lors du refus");
      }

      setBarbers((prev) =>
        prev.map((b) => (b.id === barberId ? { ...b, isApproved: false } : b))
      );
      toast("Barbier refusé", "info");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur lors du refus",
        "error"
      );
    }
  }

  async function handleAddBarber() {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !shop) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/shops/${shop.id}/barbers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          bio: formData.bio.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création du barbier");
      }

      if (data.barber) {
        setBarbers((prev) => [...prev, data.barber]);
      }

      // Store created credentials for the success modal
      setCreatedCredentials({
        name: formData.name.trim(),
        email: data.credentials?.email || formData.email.trim(),
        password: data.credentials?.password,
        phone: data.credentials?.phone || formData.phone.trim(),
        whatsappUrl: data.whatsappUrl,
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        bio: "",
      });

      setShowAddModal(false);
      setShowSuccessModal(true);
      toast("Barbier créé avec succès !", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur lors de la création",
        "error"
      );
    } finally {
      setAdding(false);
    }
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

  if (!shop) {
    return (
      <div className="text-center text-neutral-500 py-20">
        <Users className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Aucun salon trouvé
        </p>
        <p className="text-sm mt-1">
          Créez d&apos;abord un salon pour gérer les barbiers
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
            Équipe
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Gérez vos barbiers et leurs accès au salon
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 shadow-lg">
          <Plus className="h-5 w-5" />
          Ajouter un membre
        </Button>
      </div>

      {barbers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 py-24 text-center flex flex-col items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            Aucun barbier
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mb-8">
            Vous n&apos;avez pas encore de barbiers dans votre salon. Invitez-les à rejoindre votre équipe.
          </p>
          <Button onClick={() => setShowAddModal(true)} className="gap-2 rounded-xl" size="lg">
            <Plus className="h-5 w-5" />
            Ajouter un barbier
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {barbers.map((barber) => {
            const barberAppts = appointments.filter(a => a.barberId === barber.id);
            const completedAppts = barberAppts.filter(a => a.status === "COMPLETED");
            const revenue = completedAppts.reduce((sum, a) => sum + (a.service?.price || 0), 0);
            
            return (
            <div key={barber.id} className="group relative rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="absolute top-0 w-full h-24 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 dark:from-violet-500/5 dark:to-indigo-500/5" />
              
              <div className="relative pt-6 px-6 pb-4 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 p-1 shadow-lg">
                    <div className="h-full w-full rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center overflow-hidden border-2 border-white dark:border-neutral-900">
                      {barber.user.image ? (
                        <img src={barber.user.image} alt={barber.user.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold bg-gradient-to-br from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                          {barber.user.name?.[0]?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                  </div>
                  {barber.isApproved && (
                    <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-green-500 border-2 border-white dark:border-neutral-900 flex items-center justify-center shadow-sm">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-neutral-900 dark:text-white truncate w-full">
                  {barber.user.name}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate w-full mt-0.5">
                  {barber.user.email}
                </p>

                <div className="mt-4 flex items-center justify-center">
                  {barber.isApproved ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/20 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      En attente
                    </span>
                  )}
                </div>
                
                {/* Stats Section */}
                <div className="mt-5 w-full grid grid-cols-2 gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                  <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50">
                    <span className="text-xl font-black text-neutral-900 dark:text-white">{completedAppts.length}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 mt-1">Prestations</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/20">
                    <span className="text-lg font-black text-violet-600 dark:text-violet-400">{formatPrice(revenue)}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-violet-600/70 dark:text-violet-400/70 mt-1">Revenu</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto p-4 border-t border-neutral-100 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50">
                {!barber.isApproved ? (
                  <Button
                    onClick={() => handleApprove(barber.id)}
                    className="w-full gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20"
                  >
                    <UserCheck className="h-4 w-4" />
                    Approuver l'accès
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleReject(barber.id)}
                    className="w-full gap-2 rounded-xl border-neutral-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-neutral-700 dark:hover:bg-red-900/20 dark:hover:border-red-900/50"
                  >
                    <UserX className="h-4 w-4" />
                    Suspendre l'accès
                  </Button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData({ name: "", email: "", phone: "", bio: "" });
        }}
        title="Créer un compte Barbier"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddBarber();
          }}
          className="space-y-4 pt-2"
        >
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1 ml-0.5">
              Nom complet
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ex: Jean Dupont"
              required
              className="rounded-xl border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1 ml-0.5">
              Adresse e-mail
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ex: jean.dupont@barber.com"
              required
              className="rounded-xl border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1 ml-0.5">
              Numéro de téléphone / WhatsApp
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="ex: +21655123456 ou 55123456"
              required
              className="rounded-xl border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              Sera utilisé pour lui envoyer ses identifiants par WhatsApp.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1 ml-0.5">
              Biographie (Optionnel)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="ex: Expert en dégradés et barbe..."
              className="flex min-h-[80px] w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setFormData({ name: "", email: "", phone: "", bio: "" });
              }}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={adding} className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20">
              {adding ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="h-4 w-4" />}
              {adding ? "Création en cours..." : "Créer le compte"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Success Modal showing Credentials & WhatsApp Action */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setCreatedCredentials(null);
        }}
        title="Compte créé avec succès ! 🎉"
      >
        <div className="space-y-6 pt-2">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-600 dark:text-emerald-400 leading-relaxed">
            Le compte de <strong>{createdCredentials?.name}</strong> a été créé en tant que Barbier. Veuillez lui transmettre ses accès de connexion ci-dessous.
          </div>

          <div className="space-y-3">
            <div className="relative p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Identifiant (Email)</span>
                <span className="text-sm font-semibold text-neutral-800 dark:text-white font-mono">{createdCredentials?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(createdCredentials?.email || "", "email")}
                className="h-8 w-8 p-0 rounded-lg shrink-0 hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                {copiedEmail ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-neutral-400" />}
              </Button>
            </div>

            <div className="relative p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Mot de passe temporaire</span>
                <span className="text-sm font-semibold text-neutral-800 dark:text-white font-mono">{createdCredentials?.password}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(createdCredentials?.password || "", "password")}
                className="h-8 w-8 p-0 rounded-lg shrink-0 hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                {copiedPassword ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-neutral-400" />}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
            {createdCredentials?.whatsappUrl && (
              <Button
                onClick={() => {
                  window.open(createdCredentials.whatsappUrl, "_blank");
                }}
                className="w-full gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 font-bold py-5 text-sm transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <WhatsAppIcon className="h-5 w-5 text-white" />
                Envoyer les accès sur WhatsApp
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessModal(false);
                setCreatedCredentials(null);
              }}
              className="w-full rounded-xl py-5"
            >
              Terminer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
