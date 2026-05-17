"use client";

import * as React from "react";
import { Users, Check, X, Plus, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [addEmail, setAddEmail] = React.useState("");
  const [adding, setAdding] = React.useState(false);

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
    if (!addEmail.trim() || !shop) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/shops/${shop.id}/barbers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || "Erreur lors de l'ajout du barbier"
        );
      }

      const data = await res.json();
      if (data.barber) {
        setBarbers((prev) => [...prev, data.barber]);
      }
      setAddEmail("");
      setShowAddModal(false);
      toast("Barbier ajouté avec succès", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur lors de l'ajout",
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
          setAddEmail("");
        }}
        title="Ajouter un membre"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddBarber();
          }}
          className="space-y-6 pt-2"
        >
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Adresse e-mail du barbier
            </label>
            <Input
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="exemple@barber.com"
              required
              className="rounded-xl px-4 py-6 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
            />
            <p className="text-xs font-medium text-neutral-500 mt-2">
              Note : L'utilisateur doit avoir un compte avec le rôle BARBER
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setAddEmail("");
              }}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={adding} className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20">
              {adding ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="h-4 w-4" />}
              {adding ? "Invitation en cours..." : "Inviter dans l'équipe"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
