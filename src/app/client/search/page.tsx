"use client";

import * as React from "react";
import Link from "next/link";
import { Search, MapPin, Scissors, ArrowRight, Sparkles, Star } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  address: string;
  description: string;
  _count?: { barbers: number };
  barbers?: { id: string }[];
}

export default function ClientSearchPage() {
  const [query, setQuery] = React.useState("");
  const [shops, setShops] = React.useState<Shop[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchShops = React.useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = q.trim()
        ? `/api/shops?q=${encodeURIComponent(q.trim())}`
        : "/api/shops";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setShops(Array.isArray(data.shops) ? data.shops : Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchShops(query);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => fetchShops(query), 300);
    return () => clearTimeout(timer);
  }, [query, fetchShops]);

  return (
    <div className="space-y-10 animate-fade-in max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header section with gradient text */}
      <div className="text-center sm:text-left space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
          Nos Salons
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
          Choisissez le salon de votre choix et réservez votre créneau en quelques clics.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-3xl group">
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-500/30 to-indigo-500/30 opacity-50 blur-xl transition-all duration-500 group-hover:opacity-100 group-focus-within:opacity-100" />
        <div className="relative flex items-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl shadow-lg p-2 transition-transform duration-300 group-focus-within:scale-[1.02]">
          <div className="flex items-center justify-center h-12 w-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl ml-1">
            <Search className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une de nos adresses..."
            className="flex-1 h-12 px-4 bg-transparent border-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-0 text-lg"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-pulse">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl border-4 border-violet-200 dark:border-violet-900 border-t-violet-600 dark:border-t-violet-400 animate-spin" />
            <Scissors className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-violet-600 dark:text-violet-400 opacity-50" />
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">Recherche des meilleurs salons...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Empty states */}
      {!loading && shops.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-xl">
          <div className="h-20 w-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-6">
            {query.trim() ? (
              <Search className="h-10 w-10 text-violet-500 dark:text-violet-400" />
            ) : (
              <Sparkles className="h-10 w-10 text-violet-500 dark:text-violet-400" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            {query.trim() ? "Aucun salon trouvé" : "Aucun salon disponible"}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
            {query.trim() 
              ? `Nous n'avons trouvé aucun résultat pour "${query}". Essayez avec d'autres mots-clés.` 
              : "Il n'y a pas de salons disponibles pour le moment. Revenez plus tard !"}
          </p>
        </div>
      )}

      {/* Grid of shops */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shops.map((shop, index) => (
          <Link 
            key={shop.id} 
            href={`/client/shops/${shop.id}`} 
            style={{ animationDelay: `${index * 50}ms` }}
            className="group animate-slide-up"
          >
            <div className="h-full relative overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.2)] dark:hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.1)] hover:border-violet-300 dark:hover:border-violet-700/50 flex flex-col">
              
              {/* Gradient Top Bar */}
              <div className="h-32 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 dark:from-violet-500/10 dark:to-indigo-500/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-[2px]" />
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-violet-500/20 dark:bg-violet-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="absolute top-4 right-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1 shadow-sm">
                  <Star className="h-3 w-3 fill-current" />
                  Nouveau
                </div>
              </div>

              {/* Avatar/Logo overlapping the top bar */}
              <div className="px-6 relative -mt-10">
                <div className="h-20 w-20 rounded-2xl bg-white dark:bg-neutral-800 shadow-xl flex items-center justify-center border-4 border-white dark:border-neutral-900 transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                  <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-violet-600 to-indigo-600">
                    {shop.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {shop.name}
                </h3>
                
                {shop.description && (
                  <p className="line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400 mb-6 flex-1">
                    {shop.description}
                  </p>
                )}

                <div className="space-y-3 mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                    </div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-1">{shop.address}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Scissors className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                    </div>
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                      {shop._count?.barbers ?? shop.barbers?.length ?? 0} expert{(shop._count?.barbers ?? shop.barbers?.length ?? 0) > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Hover action button */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-semibold text-violet-600 dark:text-violet-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Prendre rendez-vous
                  </span>
                  <div className="h-10 w-10 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
