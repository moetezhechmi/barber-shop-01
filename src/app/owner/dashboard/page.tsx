"use client";

import * as React from "react";
import { Calendar, Users, Scissors, Euro, Clock, User } from "lucide-react";
import { formatDate, formatTime, getStatusColor, getStatusLabel, formatPrice } from "@/lib/utils";

interface Shop {
  id: string;
  name: string;
  ownerId: string;
  _count: { barbers: number };
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface BarberUser {
  id: string;
  name: string;
  image: string | null;
}

interface Barber {
  id: string;
  userId: string;
  shopId: string;
  isApproved: boolean;
  user: BarberUser;
}

interface AppointmentBarber {
  id: string;
  user: { id: string; name: string; image: string | null };
}

interface AppointmentService {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  client: { id: string; name: string; email: string };
  barber: AppointmentBarber;
  service: AppointmentService;
  shop: { id: string; name: string };
}

export default function OwnerDashboardPage() {
  const [shops, setShops] = React.useState<Shop[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [barbers, setBarbers] = React.useState<Barber[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [shopsRes, appointmentsRes, barbersRes] = await Promise.all([
          fetch("/api/shops"),
          fetch("/api/appointments"),
          fetch("/api/barbers"),
        ]);

        if (!shopsRes.ok || !appointmentsRes.ok || !barbersRes.ok) {
          throw new Error("Erreur lors de la récupération des données");
        }

        const shopsData = await shopsRes.json();
        const appointmentsData = await appointmentsRes.json();
        const barbersData = await barbersRes.json();

        setShops(shopsData.shops || []);
        setAppointments(appointmentsData.appointments || []);
        setBarbers(barbersData.barbers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-pulse">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl border-4 border-violet-200 dark:border-violet-900 border-t-violet-600 dark:border-t-violet-400 animate-spin" />
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  const totalBarbers = barbers.filter((b) => b.isApproved).length;
  const totalServices = shops.reduce((sum, s) => sum + (s._count?.barbers || 0), 0);
  const completedAppointments = appointments.filter((a) => a.status === "COMPLETED");
  const revenue = completedAppointments.reduce(
    (sum, a) => sum + (a.service?.price || 0),
    0
  );
  const recentAppointments = appointments.slice(0, 10);

  const stats = [
    {
      label: "Rendez-vous",
      value: appointments.length.toString(),
      icon: Calendar,
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      label: "Barbiers",
      value: totalBarbers.toString(),
      icon: Users,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      label: "Services",
      value: totalServices.toString(),
      icon: Scissors,
      gradient: "from-emerald-400 to-emerald-600",
    },
    {
      label: "Revenu",
      value: formatPrice(revenue),
      icon: Euro,
      gradient: "from-amber-400 to-orange-500",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
          Tableau de bord
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Vue d'ensemble de votre salon et vos activités récentes
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-3xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-neutral-200/50 dark:border-white/10 p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  {stat.label}
                </span>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                  {stat.value}
                </p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${stat.gradient} transition-all duration-300 group-hover:w-full`} />
            </div>
          );
        })}
      </div>

      {/* Recent Appointments */}
      <div className="rounded-3xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-neutral-200/50 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-neutral-200/50 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
            Rendez-vous récents
          </h2>
        </div>
        
        <div className="p-4 sm:p-6">
          {recentAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mb-4" />
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                Aucun rendez-vous pour le moment
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {recentAppointments.map((apt) => (
                <div 
                  key={apt.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 hover:border-violet-200 dark:hover:border-violet-900/50 transition-colors shadow-sm"
                >
                  <div className="flex items-start sm:items-center gap-4 flex-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold text-lg">
                      {apt.client?.name ? apt.client.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-bold text-neutral-900 dark:text-neutral-50 truncate text-lg">
                        {apt.client?.name || "Client Inconnu"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Scissors className="h-3.5 w-3.5" />
                          {apt.service?.name || "—"}
                        </span>
                        <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">•</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          {apt.barber?.user?.name || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t border-neutral-100 dark:border-neutral-800 sm:border-0 pt-4 sm:pt-0">
                    <div className="flex flex-col sm:items-end">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatDate(apt.date)}
                      </span>
                      <span className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {formatTime(apt.startTime)}
                      </span>
                    </div>
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${getStatusColor(apt.status)}`}>
                      {getStatusLabel(apt.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
