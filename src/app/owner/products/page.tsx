"use client";

import * as React from "react";
import { 
  Package, Plus, Search, Edit2, Trash2, CheckCircle2, 
  ShoppingBag, Clock, Check, X, AlertCircle, Upload, Loader2, ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { formatPrice, formatDate } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image: string | null;
  category: string;
  isAvailable: boolean;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { id: string; name: string; image: string | null };
}

interface Order {
  id: string;
  total: number;
  status: string;
  notes: string | null;
  createdAt: string;
  client: { id: string; name: string; email: string; phone: string | null };
  items: OrderItem[];
}

const CATEGORIES = ["Barbe", "Cheveux", "Soins", "Accessoires"];

export default function OwnerProductsPage() {
  const { toast } = useToast();
  const [tab, setTab] = React.useState<"products" | "orders">("products");
  const [products, setProducts] = React.useState<Product[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  // Product modal
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    price: "",
    stock: "10",
    image: "",
    category: "Soins",
    isAvailable: true,
  });
  const [saving, setSaving] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, ordRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/orders"),
      ]);
      if (prodRes.ok) {
        const d = await prodRes.json();
        setProducts(d.products || []);
      }
      if (ordRes.ok) {
        const d = await ordRes.json();
        setOrders(d.orders || []);
      }
    } catch {
      toast("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "10",
      image: "",
      category: "Soins",
      isAvailable: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      image: product.image || "",
      category: product.category,
      isAvailable: product.isAvailable,
    });
    setModalOpen(true);
  };


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const bodyFormData = new FormData();
    bodyFormData.append("file", file);

    setUploadingImage(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: bodyFormData,
      });

      if (!res.ok) throw new Error("Erreur de téléchargement");
      const data = await res.json();
      setFormData((prev) => ({ ...prev, image: data.url }));
      toast("Image téléversée avec succès !", "success");
    } catch {
      toast("Erreur lors de l'upload de l'image", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        image: formData.image.trim() || null,
        category: formData.category,
        isAvailable: formData.isAvailable,
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erreur de sauvegarde");

      toast(editingProduct ? "Produit mis à jour !" : "Produit ajouté au catalogue !", "success");
      setModalOpen(false);
      loadData();
    } catch {
      toast("Une erreur est survenue", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast("Produit supprimé", "success");
    } catch {
      toast("Impossible de supprimer ce produit", "error");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      toast("Statut de la commande mis à jour", "success");
    } catch {
      toast("Erreur lors de la mise à jour", "error");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;

  if (loading) {
    return (
      <Spinner fullPage label="Chargement de la boutique et des commandes..." />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2.5">
            <ShoppingBag className="h-8 w-8 text-violet-600" />
            Boutique & Produits
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Gérez vos produits en vente au salon et les commandes Click & Collect.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenCreate}
            className="rounded-2xl gap-2 shadow-lg shadow-violet-500/20 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <button
          onClick={() => setTab("products")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
            tab === "products"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          }`}
        >
          <Package className="h-4 w-4" />
          Catalogue ({products.length})
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
            tab === "orders"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          Commandes Click & Collect ({orders.length})
          {pendingOrders > 0 && (
            <span className="h-5 px-1.5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center">
              {pendingOrders}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PRODUCTS CATALOG */}
      {tab === "products" && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-2xl border-neutral-200 dark:border-neutral-800"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
              <Package className="h-12 w-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">Aucun produit en rayon</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Commencez par ajouter les cires, shampoings, huiles ou accessoires vendus dans votre salon.
              </p>
              <Button onClick={handleOpenCreate} className="mt-4 rounded-xl gap-2" size="sm">
                <Plus className="h-4 w-4" /> Ajouter mon premier produit
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  <div className="h-44 w-full bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-neutral-800 shadow-sm">
                      {p.category}
                    </span>
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      p.stock > 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                    }`}>
                      {p.stock > 0 ? `${p.stock} en stock` : "Épuisé"}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-neutral-900 dark:text-white text-base leading-snug line-clamp-1">
                        {p.name}
                      </h4>
                      {p.description && (
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <span className="text-lg font-black text-violet-600 dark:text-violet-400">
                        {formatPrice(p.price)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 text-neutral-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS LIST */}
      {tab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
              <ShoppingBag className="h-12 w-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">Aucune commande pour le moment</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Les commandes passées par vos clients apparaîtront ici avec les articles à préparer.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => {
                const isPending = ord.status === "PENDING";
                const isReady = ord.status === "READY";
                const isCompleted = ord.status === "COMPLETED";
                const isCancelled = ord.status === "CANCELLED";

                if (loading) {
    return (
      <Spinner fullPage label="Chargement de la boutique et des commandes..." />
    );
  }

  return (
                  <div
                    key={ord.id}
                    className="p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-sm text-neutral-900 dark:text-white">
                          Client : {ord.client?.name || "Client"}
                        </span>
                        {ord.client?.phone && (
                          <span className="text-xs text-neutral-500">
                            • 📞 {ord.client.phone}
                          </span>
                        )}
                        <span className="text-xs text-neutral-400">
                          • {formatDate(ord.createdAt.slice(0, 10))}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs px-3 py-1 font-bold ${
                            isPending
                              ? "bg-amber-100 text-amber-800"
                              : isReady
                              ? "bg-blue-100 text-blue-800"
                              : isCompleted
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isPending && "En attente de préparation"}
                          {isReady && "Prête au salon"}
                          {isCompleted && "Récupérée & Payée"}
                          {isCancelled && "Annulée"}
                        </Badge>
                      </div>
                    </div>

                    {/* Order items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {ord.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50"
                        >
                          <div className="h-10 w-10 rounded-xl bg-neutral-200 dark:bg-neutral-700 shrink-0 overflow-hidden flex items-center justify-center">
                            {it.product?.image ? (
                              <img src={it.product.image} alt={it.product.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-4 w-4 text-neutral-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 text-xs">
                            <p className="font-bold text-neutral-900 dark:text-white truncate">
                              {it.product?.name}
                            </p>
                            <p className="text-neutral-500 mt-0.5">
                              {it.quantity} x {formatPrice(it.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {ord.notes && (
                      <p className="text-xs italic text-neutral-500 bg-neutral-50 dark:bg-neutral-800/30 p-2.5 rounded-xl">
                        Note client : « {ord.notes} »
                      </p>
                    )}

                    {/* Actions and Total */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="text-sm">
                        <span className="text-neutral-500">Total à encaisser : </span>
                        <span className="font-black text-violet-600 text-base">{formatPrice(ord.total)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(ord.id, "READY")}
                            className="rounded-xl gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-bold"
                          >
                            <Check className="h-3.5 w-3.5" /> Marquer "Prête au salon"
                          </Button>
                        )}
                        {(isPending || isReady) && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(ord.id, "COMPLETED")}
                            className="rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Terminé & Encaissé
                          </Button>
                        )}
                        {!isCompleted && !isCancelled && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateOrderStatus(ord.id, "CANCELLED")}
                            className="rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold"
                          >
                            <X className="h-3.5 w-3.5" /> Annuler
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? "Modifier le produit" : "Ajouter un produit"}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">
              Nom du produit
            </label>
            <Input
              type="text"
              required
              placeholder="ex: Cire coiffante Mat 150ml"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">
                Prix (DT)
              </label>
              <Input
                type="number"
                step="0.5"
                required
                placeholder="25.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">
                Stock disponible
              </label>
              <Input
                type="number"
                required
                placeholder="10"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">
              Catégorie
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">
              Photo du produit
            </label>
            <div className="space-y-3">
              {/* Preview & Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer group flex flex-col items-center justify-center p-4 border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-violet-500 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 transition-all text-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {uploadingImage ? (
                  <div className="py-6 flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    <p className="text-xs font-semibold text-neutral-500">Téléversement de l'image...</p>
                  </div>
                ) : formData.image ? (
                  <div className="relative w-full flex flex-col items-center">
                    <div className="h-32 w-32 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-sm relative mb-2">
                      <img src={formData.image} alt="Aperçu" className="h-full w-full object-cover" />
                    </div>
                    <p className="text-xs font-bold text-violet-600 group-hover:underline">
                      Cliquer pour changer la photo
                    </p>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 flex items-center justify-center">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Cliquez pour choisir une photo depuis votre appareil
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        PNG, JPG, WebP jusqu'à 5 Mo
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Description, conseils d'utilisation ou ingrédients..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold">
              {saving ? "Enregistrement..." : editingProduct ? "Mettre à jour" : "Ajouter le produit"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
