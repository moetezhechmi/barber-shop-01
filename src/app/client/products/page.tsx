"use client";

import * as React from "react";
import { 
  ShoppingBag, Search, Plus, Minus, Trash2, CheckCircle2, 
  ArrowRight, Sparkles, Package, MapPin, Store, Check, Info, ShieldCheck,
  Flame, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { formatPrice } from "@/lib/utils";

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

interface CartItem {
  product: Product;
  quantity: number;
}

const CATEGORIES = ["Tous", "Barbe", "Cheveux", "Soins", "Accessoires"];

export default function ClientProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("Tous");

  // Cart state
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [ordering, setOrdering] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [orderSuccess, setOrderSuccess] = React.useState(false);

  // Quick detail preview
  const [previewProduct, setPreviewProduct] = React.useState<Product | null>(null);

  React.useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch {
        toast("Erreur lors du chargement des produits", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [toast]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast("Produit en rupture de stock", "info");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast(`Stock maximal disponible atteint (${product.stock})`, "info");
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast(`${product.name} ajouté au panier ! 🛍️`, "success");
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              toast(`Quantité maximale en stock : ${item.product.stock}`, "info");
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;
    setOrdering(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        notes: notes.trim() || undefined,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la commande");

      setCart([]);
      setNotes("");
      setCartOpen(false);
      setOrderSuccess(true);
      toast("Commande enregistrée avec succès !", "success");
    } catch (err: any) {
      toast(err.message || "Erreur lors de la validation", "error");
    } finally {
      setOrdering(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "Tous" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-32 px-4 sm:px-6 pt-2">
      {/* ── HERO BANNER PREMIUM LIGHT ── */}
      <div className="rounded-[32px] bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-6 sm:p-8 text-white shadow-xl shadow-violet-500/15 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 h-52 w-52 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 h-44 w-44 rounded-full bg-violet-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase text-white mb-3 border border-white/25 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Click & Collect au Salon
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Boutique & Soins du Salon 💈
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-violet-100 leading-relaxed">
            Réservez en ligne vos cires, huiles et accessoires préférés puis réglez et récupérez-les directement lors de votre passage.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-xl bg-black/20 backdrop-blur-sm px-3 py-1.5 font-bold text-white/95 border border-white/15">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Produits 100% professionnels
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-white/15 backdrop-blur-sm px-3 py-1.5 font-bold text-white/95 border border-white/15">
              <Store className="h-4 w-4 text-amber-300" />
              Zéro frais de livraison
            </span>
          </div>
        </div>
      </div>

      {/* ── SEARCH & CATEGORIES BAR ── */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher une cire, shampoing, huile à barbe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 rounded-2xl bg-white border-gray-200 shadow-sm text-sm placeholder:text-gray-400 focus:border-violet-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full h-5 w-5 flex items-center justify-center"
            >
              ×
            </button>
          )}
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-violet-600 text-white shadow-md shadow-violet-200 scale-[1.02]"
                    : "bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      {loading ? (
        <Spinner size="lg" label="Chargement du catalogue boutique..." />
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <Package className="h-14 w-14 text-gray-300 mx-auto mb-3" />
          <h3 className="font-extrabold text-gray-900 text-base">Aucun produit trouvé</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Aucun article ne correspond à votre filtre. Réessayez avec un autre mot-clé ou catégorie.
          </p>
          {search && (
            <Button
              onClick={() => setSearch("")}
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl text-xs font-bold"
            >
              Effacer la recherche
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock <= 0;
            const inCart = cart.find(c => c.product.id === p.id);

            return (
              <div
                key={p.id}
                className="group rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div onClick={() => setPreviewProduct(p)} className="cursor-pointer">
                  {/* Product Image Frame */}
                  <div className="h-36 sm:h-44 w-full bg-gray-50 relative overflow-hidden flex items-center justify-center border-b border-gray-50">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-gray-300 group-hover:scale-110 transition-transform" />
                    )}

                    {/* Category badge */}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/90 backdrop-blur-md text-gray-800 shadow-sm border border-gray-100">
                      {p.category}
                    </span>

                    {/* Stock pill */}
                    <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black ${
                      isOutOfStock ? "bg-rose-500 text-white" : "bg-emerald-500/90 text-white"
                    }`}>
                      {isOutOfStock ? "Épuisé" : `En stock`}
                    </span>

                    {isOutOfStock && (
                      <span className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center text-white text-xs font-black uppercase tracking-wider">
                        Rupture
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-3.5 pb-2">
                    <h4 className="font-black text-gray-900 text-xs sm:text-sm line-clamp-1 group-hover:text-violet-600 transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
                      {p.description || "Formule professionnelle utilisée et recommandée par vos barbiers."}
                    </p>
                  </div>
                </div>

                {/* Footer with Price and Action */}
                <div className="p-3.5 pt-1 flex items-center justify-between gap-2 border-t border-gray-50">
                  <div>
                    <span className="font-black text-violet-600 text-sm sm:text-base">
                      {formatPrice(p.price)}
                    </span>
                  </div>

                  {inCart ? (
                    <div className="flex items-center gap-1.5 bg-violet-50 px-2 py-1 rounded-xl border border-violet-100">
                      <button
                        onClick={() => updateQuantity(p.id, -1)}
                        className="h-6 w-6 rounded-lg bg-white text-violet-700 flex items-center justify-center shadow-sm font-black text-xs active:scale-95"
                      >
                        -
                      </button>
                      <span className="text-xs font-black text-violet-700 w-3 text-center">
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(p.id, 1)}
                        className="h-6 w-6 rounded-lg bg-violet-600 text-white flex items-center justify-center shadow-sm font-black text-xs active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isOutOfStock}
                      onClick={() => addToCart(p)}
                      className="h-8 rounded-xl px-3 gap-1 bg-violet-600 hover:bg-violet-700 text-white font-black text-xs shadow-sm shadow-violet-200 active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FLOATING CART TRIGGER BAR ── */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto animate-fade-in">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full h-14 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl shadow-xl shadow-violet-600/30 px-5 flex items-center justify-between font-black border border-white/20 active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-full bg-white text-violet-700 text-xs flex items-center justify-center font-black shadow-sm">
                {cartItemsCount}
              </span>
              <span className="text-sm">Voir mon panier Click & Collect</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="tracking-tight">{formatPrice(cartTotal)}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}

      {/* ── PRODUCT DETAIL PREVIEW MODAL ── */}
      {previewProduct && (
        <Modal isOpen onClose={() => setPreviewProduct(null)} title={previewProduct.name}>
          <div className="space-y-4 pt-1">
            <div className="h-48 sm:h-56 w-full rounded-2xl bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-100">
              {previewProduct.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewProduct.image} alt={previewProduct.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-16 w-16 text-gray-300" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-violet-50 text-violet-700 border border-violet-100">
                {previewProduct.category}
              </span>
              <span className="text-xl font-black text-violet-600">
                {formatPrice(previewProduct.price)}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-gray-400 mb-1">Description & Conseils</h4>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                {previewProduct.description || "Produit de qualité professionnelle disponible directement au salon."}
              </p>
            </div>

            <Button
              disabled={previewProduct.stock <= 0}
              onClick={() => {
                addToCart(previewProduct);
                setPreviewProduct(null);
              }}
              className="w-full py-5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
            >
              {previewProduct.stock > 0 ? `Ajouter au panier (${formatPrice(previewProduct.price)})` : "Rupture de stock"}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── CART MODAL ── */}
      <Modal isOpen={cartOpen} onClose={() => setCartOpen(false)} title="Mon Panier Click & Collect">
        <div className="space-y-4 pt-2">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-xs">Votre panier est vide.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100"
                >
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-bold text-gray-900 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-violet-600 font-bold mt-0.5">
                      {formatPrice(item.product.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="h-7 w-7 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-sm font-bold active:scale-95"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-black w-4 text-center text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="h-7 w-7 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm font-bold active:scale-95"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="h-7 w-7 rounded-xl text-rose-500 hover:bg-rose-50 flex items-center justify-center ml-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Click & Collect reassurance pill */}
          <div className="p-3.5 rounded-2xl bg-violet-50 border border-violet-100 text-xs text-violet-800 flex items-start gap-2">
            <Store className="h-4 w-4 shrink-0 mt-0.5 text-violet-600" />
            <div>
              <p className="font-bold">Retrait & Règlement au salon</p>
              <p className="text-[11px] text-violet-700/80 mt-0.5 leading-relaxed">
                Vos produits sont mis de côté et prêts lors de votre prochaine coupe. Vous ne payez qu'une fois sur place.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">
              Instructions ou message (Optionnel)
            </label>
            <Input
              type="text"
              placeholder="ex: Je passerai vendredi à 16h, merci !"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl text-xs bg-gray-50 border-gray-200"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total à régler sur place</span>
            <span className="text-xl font-black text-violet-600">
              {formatPrice(cartTotal)}
            </span>
          </div>

          <Button
            onClick={handleConfirmOrder}
            disabled={ordering || cart.length === 0}
            className="w-full py-5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black shadow-lg shadow-violet-200"
          >
            {ordering ? "Validation..." : "Confirmer ma réservation"}
          </Button>
        </div>
      </Modal>

      {/* ── SUCCESS CONFIRMATION MODAL ── */}
      <Modal isOpen={orderSuccess} onClose={() => setOrderSuccess(false)} title="Commande confirmée ! 🎉">
        <div className="text-center py-4 space-y-4">
          <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-lg">
              Votre commande est prête à être préparée
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Le salon a bien reçu vos articles. Vous pouvez les récupérer et régler directement sur place lors de votre passage.
            </p>
          </div>
          <Button onClick={() => setOrderSuccess(false)} className="rounded-2xl w-full py-4 font-bold bg-violet-600 hover:bg-violet-700 text-white">
            Super, merci !
          </Button>
        </div>
      </Modal>
    </div>
  );
}
