"use client";

import * as React from "react";
import { Scissors, Plus, Pencil, Trash2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/utils";

interface Service {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
}

interface Shop {
  id: string;
  name: string;
  ownerId: string;
}

export default function OwnerServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = React.useState<Service[]>([]);
  const [shop, setShop] = React.useState<Shop | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [showModal, setShowModal] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    price: "",
    duration: "",
  });
  const [saving, setSaving] = React.useState(false);

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

        const servicesRes = await fetch(`/api/shops/${userShop.id}/services`);
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          setServices(servicesData.services || []);
        }
      } else {
        setShop(null);
        setServices([]);
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

  function openAddModal() {
    setEditingService(null);
    setFormData({ name: "", description: "", price: "", duration: "" });
    setShowModal(true);
  }

  function openEditModal(service: Service) {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      duration: service.duration.toString(),
    });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration, 10),
      };

      if (editingService) {
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Erreur lors de la modification");
        }

        const data = await res.json();
        setServices((prev) =>
          prev.map((s) =>
            s.id === editingService.id ? (data.service || data) : s
          )
        );
        toast("Service modifié avec succès", "success");
      } else {
        if (!shop) throw new Error("Aucun salon trouvé");

        const res = await fetch(`/api/shops/${shop.id}/services`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Erreur lors de la création");
        }

        const data = await res.json();
        if (data.service) {
          setServices((prev) => [...prev, data.service]);
        }
        toast("Service créé avec succès", "success");
      }

      setShowModal(false);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Une erreur est survenue",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(serviceId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) return;

    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de la suppression");
      }

      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      toast("Service supprimé avec succès", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur lors de la suppression",
        "error"
      );
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
        <Scissors className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Aucun salon trouvé
        </p>
        <p className="text-sm mt-1">
          Créez d&apos;abord un salon pour gérer les services
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Services
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Gérez les services proposés par votre salon
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Ajouter un service
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Scissors className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Aucun service
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">
              Vous n&apos;avez pas encore de services. Ajoutez-en un pour
              commencer.
            </p>
            <Button onClick={openAddModal}>
              <Plus className="h-4 w-4" />
              Ajouter un service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.description && (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                    {formatPrice(service.price)}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                    <Clock className="h-4 w-4" />
                    {service.duration} min
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(service)}
                  >
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingService ? "Modifier le service" : "Ajouter un service"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Nom
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Coupe homme"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Description du service"
              className="flex h-20 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Prix (€)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
                placeholder="25.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Durée (minutes)
              </label>
              <Input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                required
                placeholder="30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Enregistrement..."
                : editingService
                ? "Enregistrer"
                : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
