"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Star, MapPin, Phone, Scissors, Clock, Euro, CheckCircle,
  ArrowLeft, Sparkles, Loader2, ChevronRight, X, UserCircle2, CalendarDays,
  Wifi, Coffee, Gamepad, Snowflake, Car, Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";

const AMENITIES_LIST = [
  { key: "wifi", label: "Wi-Fi Gratuit", icon: Wifi, color: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50" },
  { key: "coffee", label: "Café & Boisson", icon: Coffee, color: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50" },
  { key: "playstation", label: "PlayStation / Jeux", icon: Gamepad, color: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50" },
  { key: "ac", label: "Climatiseur", icon: Snowflake, color: "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50" },
  { key: "parking", label: "Parking Privé", icon: Car, color: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50" },
];

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
}

interface Barber {
  id: string;
  user: { id: string; name: string; image?: string };
  bio?: string;
  reviews?: { rating: number }[];
  gallery?: GalleryImage[];
}

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
}

interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  description: string | null;
  images?: string[];
  amenities?: string[];
  barbers: Barber[];
  services: Service[];
}

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [shop, setShop] = React.useState<Shop | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedService, setSelectedService] = React.useState("");
  const [selectedBarber, setSelectedBarber] = React.useState(""); // "any" or barber.id
  const [selectedDate, setSelectedDate] = React.useState("");
  
  // Array of { time, barberId }
  const [availableSlots, setAvailableSlots] = React.useState<{ time: string; barberId: string }[]>([]);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  
  const [selectedTime, setSelectedTime] = React.useState("");
  const [assignedBarberId, setAssignedBarberId] = React.useState("");
  
  const [notes, setNotes] = React.useState("");
  const [showBookingSheet, setShowBookingSheet] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState<any>(null);
  const [activeBarberProfile, setActiveBarberProfile] = React.useState<Barber | null>(null);
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = React.useState(true);

  const sheetRef = React.useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split("T")[0];

  const [isPromo, setIsPromo] = React.useState(false);
  const [promoStart, setPromoStart] = React.useState("");
  const [promoEnd, setPromoEnd] = React.useState("");
  const [promoDiscount, setPromoDiscount] = React.useState("");
  const [promoTitle, setPromoTitle] = React.useState("");

  const dateTimeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const isPromoParam = searchParams.get("promo") === "true";
      if (isPromoParam) {
        setIsPromo(true);
        setPromoStart(searchParams.get("startDate") || "");
        setPromoEnd(searchParams.get("endDate") || "");
        setPromoDiscount(searchParams.get("discount") || "");
        setPromoTitle(searchParams.get("title") || "");
      }
    }
  }, []);

  React.useEffect(() => {
    if (isPromo && shop) {
      if (!selectedService && shop.services.length > 0) {
        setSelectedService(shop.services[0].id);
      }
      if (!selectedBarber) {
        setSelectedBarber("any");
      }
      if (!selectedDate && promoStart) {
        const todayStr = new Date().toISOString().split("T")[0];
        const initialDate = todayStr >= promoStart && todayStr <= promoEnd ? todayStr : promoStart;
        setSelectedDate(initialDate);
      }
    }
  }, [isPromo, shop, promoStart, promoEnd, selectedService, selectedBarber, selectedDate]);

  React.useEffect(() => {
    if (isPromo && shop && selectedDate) {
      const timer = setTimeout(() => {
        dateTimeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isPromo, shop, selectedDate]);

  React.useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/shops/${params.id}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setShop(data.shop ?? data))
      .catch(() => setError("Impossible de charger le salon"))
      .finally(() => setLoading(false));

    setReviewsLoading(true);
    fetch(`/api/reviews?shopId=${params.id}`)
      .then((r) => r.ok ? r.json() : { reviews: [] })
      .then((data) => setReviews(data.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [params.id]);

  React.useEffect(() => {
    if (!selectedBarber || !selectedDate || !shop) {
      setAvailableSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSelectedTime("");
    setAssignedBarberId("");

    const fetchSlots = async () => {
      try {
        if (selectedBarber === "any") {
          // Fetch for all barbers
          const promises = shop.barbers.map(b => 
            fetch(`/api/barbers/${b.id}/availability?date=${selectedDate}`)
              .then(r => r.ok ? r.json() : { slots: [] })
              .then(d => ({ barberId: b.id, slots: Array.isArray(d.slots) ? d.slots : [] }))
          );
          const results = await Promise.all(promises);
          
          const combinedSlots: { time: string; barberId: string }[] = [];
          const seenTimes = new Set<string>();
          
          // Sort results to pick times properly, maybe randomize barbers or pick first available
          results.forEach(res => {
            res.slots.forEach((time: string) => {
              if (!seenTimes.has(time)) {
                seenTimes.add(time);
                combinedSlots.push({ time, barberId: res.barberId });
              }
            });
          });
          
          combinedSlots.sort((a, b) => a.time.localeCompare(b.time));
          setAvailableSlots(combinedSlots);
        } else {
          const res = await fetch(`/api/barbers/${selectedBarber}/availability?date=${selectedDate}`);
          const data = await res.json();
          const slots = Array.isArray(data.slots) ? data.slots : [];
          setAvailableSlots(slots.map((time: string) => ({ time, barberId: selectedBarber })));
        }
      } catch (err) {
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [selectedBarber, selectedDate, shop]);

  const getBarberRating = (barber: Barber) => {
    if (!barber.reviews?.length) return null;
    return barber.reviews.reduce((s, r) => s + r.rating, 0) / barber.reviews.length;
  };

  const handleTimeSelect = (time: string, barberId: string) => {
    setSelectedTime(time);
    setAssignedBarberId(barberId);
  };

  const handleBook = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime || !assignedBarberId) {
      toast("Veuillez remplir tous les champs", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService,
          barberId: assignedBarberId,
          shopId: shop!.id,
          date: selectedDate,
          startTime: selectedTime,
          notes,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de la réservation");
      }
      const data = await res.json();
      setConfirmation(data.appointment ?? data);
      toast("Rendez-vous confirmé !", "success");
      setShowBookingSheet(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedServiceData = shop?.services.find((s) => s.id === selectedService);
  const originalPrice = selectedServiceData ? selectedServiceData.price : 0;
  const discountedPrice = isPromo && promoDiscount 
    ? originalPrice * (1 - Number(promoDiscount) / 100) 
    : originalPrice;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl border-4 border-violet-200 border-t-violet-600 animate-spin dark:border-violet-900 dark:border-t-violet-400" />
            <Scissors className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-violet-600 dark:text-violet-400 opacity-50" />
          </div>
          <p className="text-sm font-medium text-neutral-500 animate-pulse">Chargement du salon...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-neutral-50 dark:bg-neutral-950">
        <p className="text-lg text-red-600 dark:text-red-400 font-medium">{error || "Salon introuvable"}</p>
        <Button variant="outline" className="mt-6 rounded-xl" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux salons
        </Button>
      </div>
    );
  }

  if (confirmation) {
    const barber = shop.barbers.find((b) => b.id === assignedBarberId);
    return (
      <div className="mx-auto max-w-md px-4 py-12 animate-fade-in">
        <div className="rounded-3xl border border-green-200 bg-white p-8 text-center shadow-2xl shadow-green-500/10 dark:border-green-900/50 dark:bg-neutral-900">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Réservation confirmée !</h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Votre rendez-vous a été enregistré avec succès.</p>
          
          <div className="mt-8 space-y-3 rounded-2xl bg-neutral-50 p-5 text-left text-sm dark:bg-neutral-800/50">
            <div className="flex items-center justify-between"><span className="text-neutral-500">Salon</span><span className="font-semibold text-neutral-900 dark:text-white">{shop.name}</span></div>
            <div className="flex items-center justify-between"><span className="text-neutral-500">Barbier</span><span className="font-semibold text-neutral-900 dark:text-white">{barber?.user?.name || "—"}</span></div>
            <div className="flex items-center justify-between"><span className="text-neutral-500">Service</span><span className="font-semibold text-neutral-900 dark:text-white">{selectedServiceData?.name || "—"}</span></div>
            <div className="flex items-center justify-between"><span className="text-neutral-500">Prix</span><span className="font-semibold text-violet-600 dark:text-violet-400">{isPromo ? formatPrice(discountedPrice) : (selectedServiceData ? formatPrice(selectedServiceData.price) : "—")}</span></div>
            <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-2" />
            <div className="flex items-center justify-between"><span className="text-neutral-500">Date</span><span className="font-semibold text-neutral-900 dark:text-white">{formatDate(selectedDate)}</span></div>
            <div className="flex items-center justify-between"><span className="text-neutral-500">Heure</span><span className="font-semibold text-neutral-900 dark:text-white">{formatTime(selectedTime)}</span></div>
          </div>
          <Button className="mt-8 w-full rounded-xl py-6 text-base shadow-lg shadow-violet-500/20" onClick={() => router.push("/client/appointments")}>
            Voir mes rendez-vous
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-32">
      {/* Hero Section */}
      <div className="relative bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="h-56 bg-neutral-900 relative overflow-hidden">
          {shop.images && shop.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.images[0]}
              alt={shop.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md transition-colors hover:bg-white/40"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="mx-auto max-w-2xl px-5 relative -mt-12 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-violet-500 to-indigo-600 text-4xl font-extrabold text-white shadow-xl dark:border-neutral-900 overflow-hidden">
              {shop.images && shop.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.images[0]} alt={shop.name} className="h-full w-full object-cover" />
              ) : (
                shop.name.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white truncate">{shop.name}</h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <MapPin className="h-4 w-4 text-violet-500 shrink-0" />
                <span className="truncate">{shop.address}</span>
              </div>
            </div>
          </div>
          
          {shop.description && (
            <p className="mt-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {shop.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {shop.phone && (
              <a href={`tel:${shop.phone}`} className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-900 dark:text-white transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700">
                <Phone className="h-4 w-4 text-violet-500" />
                {shop.phone}
              </a>
            )}
          </div>

          {/* Client-side Amenities list */}
          {shop.amenities && shop.amenities.length > 0 && (
            <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2.5">
                Équipements & Confort
              </p>
              <div className="flex flex-wrap gap-2">
                {AMENITIES_LIST.map((item) => {
                  const hasAmenity = shop.amenities?.includes(item.key);
                  if (!hasAmenity) return null;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm ${item.color}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-10">
        {/* Gallery Section */}
        {shop.images && shop.images.length > 1 && (
          <section className="animate-slide-up bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Le Salon en Images</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar -mx-2 px-2">
              {shop.images.slice(1).map((imgUrl, i) => (
                <div
                  key={i}
                  className="snap-start shrink-0 relative aspect-[4/3] w-64 rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`Photo salon ${i + 2}`}
                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Team Section */}
        {shop.barbers && shop.barbers.length > 0 && (
          <section className="animate-slide-up bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Notre Équipe de Professionnels</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {shop.barbers.map((barber) => {
                const rating = getBarberRating(barber);
                return (
                  <div
                    key={barber.id}
                    onClick={() => setActiveBarberProfile(barber)}
                    className="group flex items-center gap-4 rounded-2xl border border-neutral-100 hover:border-violet-200 bg-neutral-50/50 hover:bg-violet-50/20 p-4 transition-all duration-300 dark:border-neutral-800 dark:hover:border-violet-900/40 dark:bg-neutral-950/40 dark:hover:bg-violet-950/60 cursor-pointer shadow-sm"
                  >
                    <div className="relative shrink-0">
                      {barber.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={barber.user.image}
                          alt={barber.user.name}
                          className="h-16 w-16 rounded-2xl object-cover shadow border border-neutral-200/50 dark:border-neutral-800"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 text-xl font-bold text-white shadow">
                          {barber.user?.name?.charAt(0) || "?"}
                        </div>
                      )}
                      {rating && (
                        <div className="absolute -bottom-1.5 -right-1.5 flex items-center gap-0.5 rounded-lg bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          <Star className="h-2.5 w-2.5 fill-white" />
                          <span>{rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-neutral-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {barber.user?.name}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                        {barber.bio || "Coiffeur visagiste passionné, spécialiste des styles modernes et coupes précises."}
                      </p>
                      <span className="inline-flex items-center text-[10px] font-bold text-violet-600 dark:text-violet-400 mt-2 hover:underline">
                        Voir le profil &amp; réalisations <ChevronRight className="h-3 w-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 1: Services */}
        <section className="animate-slide-up">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold text-sm">1</div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Choisissez une prestation</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {shop.services.map((service) => {
              const isSelected = selectedService === service.id;
              return (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service.id);
                    // Reset subsequent steps if we want, but it's okay to keep them
                  }}
                  className={`relative flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-300 ${
                    isSelected
                      ? "border-violet-600 bg-violet-50 shadow-md shadow-violet-500/10 dark:border-violet-500 dark:bg-violet-900/20"
                      : "border-neutral-200 bg-white hover:border-violet-200 hover:bg-violet-50/50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-violet-900/50"
                  }`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isSelected ? "bg-violet-600 text-white shadow-inner" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}>
                    <Scissors className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 dark:text-white truncate">{service.name}</h3>
                    <p className="mt-1 flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                      <Clock className="mr-1 h-3.5 w-3.5" /> {service.duration} min
                    </p>
                    {service.description && <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{service.description}</p>}
                  </div>
                  <span className={`text-lg font-bold shrink-0 ${isSelected ? "text-violet-700 dark:text-violet-400" : "text-neutral-900 dark:text-white"}`}>
                    {formatPrice(service.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Barbers */}
        <section className={`transition-all duration-500 ${selectedService ? "opacity-100 translate-y-0" : "opacity-50 pointer-events-none translate-y-4"}`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold text-sm">2</div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Choisissez votre barbier</h2>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 px-1 -mx-1 snap-x hide-scrollbar">
            {/* "Any Barber" Option */}
            <button
              onClick={() => { setSelectedBarber("any"); setSelectedTime(""); }}
              className={`snap-start shrink-0 w-36 rounded-2xl border-2 p-4 text-center transition-all duration-300 ${
                selectedBarber === "any"
                  ? "border-violet-600 bg-violet-50 shadow-md shadow-violet-500/10 dark:border-violet-500 dark:bg-violet-900/20"
                  : "border-neutral-200 bg-white hover:border-violet-200 dark:border-neutral-800 dark:bg-neutral-900"
              }`}
            >
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                selectedBarber === "any" ? "bg-violet-600 text-white" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
              }`}>
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-3 font-semibold text-sm text-neutral-900 dark:text-white">Peu importe</p>
              <p className="mt-1 text-xs text-neutral-500">Le plus tôt</p>
            </button>

            {/* Specific Barbers */}
            {shop.barbers.map((barber) => {
              const rating = getBarberRating(barber);
              const isSelected = selectedBarber === barber.id;
              return (
                <button
                  key={barber.id}
                  onClick={() => { setSelectedBarber(barber.id); setSelectedTime(""); }}
                  className={`snap-start shrink-0 w-36 rounded-2xl border-2 p-4 text-center transition-all duration-300 flex flex-col items-center ${
                    isSelected
                      ? "border-violet-600 bg-violet-50 shadow-md shadow-violet-500/10 dark:border-violet-500 dark:bg-violet-900/20"
                      : "border-neutral-200 bg-white hover:border-violet-200 dark:border-neutral-800 dark:bg-neutral-900"
                  }`}
                >
                  <div className="relative">
                    {barber.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={barber.user.image}
                        alt={barber.user.name}
                        className="h-14 w-14 rounded-full object-cover shadow-inner border border-neutral-100 dark:border-neutral-800"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 text-lg font-bold text-white shadow-inner">
                        {barber.user?.name?.charAt(0) || "?"}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white border-2 border-white dark:border-neutral-900">
                        <CheckCircle className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <p className="mt-3 font-semibold text-sm text-neutral-900 dark:text-white w-full truncate">{barber.user?.name}</p>
                  {rating && (
                    <div className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-500" />{rating.toFixed(1)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3: Date & Time */}
        <section ref={dateTimeRef} className={`transition-all duration-500 ${selectedService && selectedBarber ? "opacity-100 translate-y-0" : "opacity-50 pointer-events-none translate-y-4"}`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold text-sm">3</div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Date et Heure</h2>
          </div>
 
          <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
            {isPromo && promoDiscount && (
              <div className="rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-500/5 to-orange-500/5 p-4 dark:border-red-900/30 dark:bg-red-950/20 flex items-center gap-3 animate-pulse">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white font-black text-sm shadow-md">
                  -{promoDiscount}%
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-600 dark:text-red-400">
                    Offre Promotionnelle Activable ! 🎉
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    Les tarifs réduits s&apos;appliqueront automatiquement pour tout créneau réservé entre le {promoStart} et le {promoEnd}.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-2">
                <CalendarDays className="h-4 w-4 text-violet-500" /> Date du rendez-vous
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); setAssignedBarberId(""); }}
                min={isPromo && promoStart ? promoStart : today}
                max={isPromo && promoEnd ? promoEnd : undefined}
                className="flex h-14 w-full rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-4 text-base font-medium transition-colors focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
              />
            </div>
            {selectedDate && (
              <div>
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-violet-500" /> Créneaux disponibles
                </label>
                
                {slotsLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    <p className="text-sm text-neutral-500">Recherche des disponibilités...</p>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {availableSlots.map((slot, idx) => {
                      const isSelected = selectedTime === slot.time;
                      return (
                        <button
                          key={`${slot.time}-${idx}`}
                          onClick={() => handleTimeSelect(slot.time, slot.barberId)}
                          className={`rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
                            isSelected
                              ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 scale-105"
                              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                          }`}
                        >
                          {formatTime(slot.time)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/50 dark:bg-amber-950/20">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 mb-3">
                      <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Aucun créneau disponible à cette date.
                    </p>
                    <p className="text-xs text-amber-600 mt-1 dark:text-amber-400/80">Veuillez choisir une autre date ou un autre barbier.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="animate-slide-up bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80 pb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Avis de nos Clients</h2>
            </div>
            {reviews.length > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 px-3 py-1 rounded-full text-xs font-bold text-amber-600 dark:text-amber-400">
                ⭐ {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} / 5 ({reviews.length} {reviews.length > 1 ? "avis" : "avis"})
              </div>
            )}
          </div>

          {reviewsLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              <p className="text-xs text-neutral-500 animate-pulse">Chargement des avis...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mb-3">
                <Star className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">Aucun avis pour le moment</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Soyez le premier à réserver et à donner votre avis !</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1 divide-y divide-neutral-100 dark:divide-neutral-800">
              {reviews.map((rev, index) => (
                <div key={rev.id} className={`pt-4 ${index === 0 ? "pt-0" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {rev.client?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rev.client.image}
                          alt={rev.client.name}
                          className="h-10 w-10 rounded-full object-cover shadow-sm border border-neutral-200/50 dark:border-neutral-700"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-bold text-neutral-600 dark:text-neutral-300">
                          {rev.client?.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">
                          {rev.client?.name || "Client vérifié"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3 w-3 ${
                                  s <= rev.rating ? "text-amber-500 fill-amber-500" : "text-neutral-200 dark:text-neutral-700"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold">•</span>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold">
                            Coiffé par {rev.barber?.user?.name || "un pro"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
                      {new Date(rev.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {rev.comment && (
                    <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 bg-neutral-50/50 dark:bg-neutral-950/40 p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800/40 leading-relaxed italic">
                      “ {rev.comment} ”
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Floating Action Button / Sticky Bottom Bar */}
      <div className={`fixed bottom-28 sm:bottom-0 left-0 right-0 z-30 transition-all duration-500 ease-in-out px-4 sm:px-0 ${
        selectedService && selectedBarber && selectedDate && selectedTime ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
      }`}>
        <div className="mx-auto max-w-2xl bg-white/90 backdrop-blur-xl border border-neutral-200/50 sm:border-x-0 sm:border-b-0 p-4 rounded-3xl sm:rounded-none shadow-2xl shadow-violet-500/10 dark:bg-neutral-950/90 dark:border-neutral-800/50">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-neutral-900 dark:text-white truncate">
                {selectedServiceData?.name}
              </p>
              <p className="text-sm text-neutral-500 font-medium flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(selectedDate)} à {formatTime(selectedTime)}
              </p>
            </div>
            <Button
              onClick={() => setShowBookingSheet(true)}
              size="lg"
              className="shrink-0 rounded-2xl px-8 shadow-lg shadow-violet-600/20 font-bold"
            >
              Réserver • {isPromo ? (
                <span className="flex items-center gap-2">
                  <span className="line-through text-xs opacity-60 font-normal">{formatPrice(originalPrice)}</span>
                  <span>{formatPrice(discountedPrice)}</span>
                </span>
              ) : formatPrice(originalPrice)}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Bottom Sheet */}
      {showBookingSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-28 sm:p-0 sm:pb-0">
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowBookingSheet(false)} />
          <div
            ref={sheetRef}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-slide-up dark:bg-neutral-900 sm:rounded-3xl"
          >
            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800 sm:hidden" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Récapitulatif</h3>
              <button onClick={() => setShowBookingSheet(false)} className="rounded-full p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-500 transition-colors dark:bg-neutral-800 dark:hover:bg-neutral-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 rounded-2xl bg-neutral-50 p-5 text-sm dark:bg-neutral-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                  <Scissors className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-white truncate">{selectedServiceData?.name}</p>
                  <p className="text-violet-600 font-bold dark:text-violet-400 flex items-center gap-2">
                    {isPromo ? (
                      <>
                        <span className="line-through text-xs text-neutral-400 font-normal">{formatPrice(originalPrice)}</span>
                        <span className="text-red-500 font-black">{formatPrice(discountedPrice)} (-{promoDiscount}%)</span>
                      </>
                    ) : (
                      formatPrice(originalPrice)
                    )}
                  </p>
                </div>
              </div>

              <div className="h-px bg-neutral-200 dark:bg-neutral-700/50" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Date</p>
                  <p className="font-medium text-neutral-900 dark:text-white flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-violet-500"/>{formatDate(selectedDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Heure</p>
                  <p className="font-medium text-neutral-900 dark:text-white flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-violet-500"/>{formatTime(selectedTime)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-neutral-500 mb-1">Barbier</p>
                  <p className="font-medium text-neutral-900 dark:text-white flex items-center gap-1.5"><UserCircle2 className="h-3.5 w-3.5 text-violet-500"/>{shop.barbers.find(b => b.id === assignedBarberId)?.user?.name || "Automatique"}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-neutral-700 dark:text-neutral-300">Un mot pour le barbier ? <span className="text-neutral-400 font-normal">(optionnel)</span></label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="flex w-full rounded-2xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm transition-colors focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white resize-none"
                placeholder="Ex: J'aimerais garder un peu de longueur..."
              />
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <Button onClick={handleBook} disabled={submitting} className="w-full rounded-2xl py-6 text-base font-bold shadow-xl shadow-violet-500/20 gap-2" size="lg">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                {submitting ? "Confirmation en cours..." : "Confirmer ma réservation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Barber Profile Modal */}
      {activeBarberProfile && (
        <Modal
          isOpen={!!activeBarberProfile}
          onClose={() => setActiveBarberProfile(null)}
          title={`Profil de ${activeBarberProfile.user.name}`}
        >
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
            <div className="flex flex-col items-center text-center gap-3">
              {activeBarberProfile.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeBarberProfile.user.image}
                  alt={activeBarberProfile.user.name}
                  className="h-24 w-24 rounded-full object-cover shadow-lg border-2 border-violet-100 dark:border-violet-900"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 text-3xl font-bold text-white shadow-lg">
                  {activeBarberProfile.user.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {activeBarberProfile.user.name}
                </h3>
                {getBarberRating(activeBarberProfile) && (
                  <div className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/50 w-fit mx-auto">
                    <Star className="h-4 w-4 fill-amber-500" />
                    <span>{getBarberRating(activeBarberProfile)!.toFixed(1)} / 5</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                À propos / Biographie
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/50">
                {activeBarberProfile.bio || "Coiffeur visagiste chevronné et passionné, expert des coiffures précises, des rasages à l'ancienne et des rituels de soin de la barbe haut de gamme."}
              </p>
            </div>

            {/* Barber Realizations Gallery */}
            {activeBarberProfile.gallery && activeBarberProfile.gallery.length > 0 && (
              <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">
                  Réalisations de {activeBarberProfile.user.name}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {activeBarberProfile.gallery.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-900 shadow-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.caption || "Réalisation"}
                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {photo.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-[10px] text-white backdrop-blur-[2px] truncate">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <Button
                onClick={() => {
                  setSelectedBarber(activeBarberProfile.id);
                  setSelectedTime("");
                  setActiveBarberProfile(null);
                  toast(`Barbier ${activeBarberProfile.user.name} sélectionné !`, "success");
                }}
                className="w-full rounded-2xl py-6 font-bold shadow-lg shadow-violet-500/20"
              >
                Prendre rendez-vous avec {activeBarberProfile.user.name}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveBarberProfile(null)}
                className="w-full rounded-2xl py-6 font-medium"
              >
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
