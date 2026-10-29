"use client";

import * as React from "react";
import { Calendar, Users, Scissors, Coins, Clock, User } from "lucide-react";
import { formatDate, formatTime, getStatusColor, getStatusLabel, formatPrice } from "@/lib/utils";

interface Shop {
  id: string;
  name: string;
  ownerId: string;
  _count: { barbers: number; services: number };
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

interface Barber {
  id: string;
  userId: string;
  shopId: string;
  isApproved: boolean;
}

const STATUS_TABS = [
  { key: "ALL",       label: "Tous" },
  { key: "PENDING",   label: "En attente" },
  { key: "CONFIRMED", label: "Confirmés" },
  { key: "COMPLETED", label: "Terminés" },
  { key: "CANCELLED", label: "Annulés" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["key"];

export default function OwnerDashboardPage() {
  const [shops, setShops] = React.useState<Shop[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [barbers, setBarbers] = React.useState<Barber[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<StatusTab>("ALL");

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

  const filteredAppointments = React.useMemo(() => {
    if (activeTab === "ALL") return appointments;
    return appointments.filter((a) => a.status === activeTab);
  }, [appointments, activeTab]);

  const countByStatus = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of STATUS_TABS) {
      counts[tab.key] = tab.key === "ALL"
        ? appointments.length
        : appointments.filter((a) => a.status === tab.key).length;
    }
    return counts;
  }, [appointments]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="h-10 w-10 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin" />
        <p className="text-sm text-neutral-400 font-medium">Chargement du tableau de bord…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  const totalBarbers = barbers.filter((b) => b.isApproved).length;
  const totalServices = shops.reduce((sum, s) => sum + (s._count?.services || 0), 0);
  const completedAppointments = appointments.filter((a) => a.status === "COMPLETED");
  const revenue = completedAppointments.reduce((sum, a) => sum + (a.service?.price || 0), 0);

  const stats = [
    { label: "Rendez-vous", value: appointments.length.toString(),  icon: Calendar, gradient: "from-blue-500 to-indigo-500"    },
    { label: "Barbiers",    value: totalBarbers.toString(),          icon: Users,    gradient: "from-violet-500 to-purple-500"  },
    { label: "Services",    value: totalServices.toString(),         icon: Scissors, gradient: "from-emerald-400 to-emerald-600"},
    { label: "Revenu",      value: formatPrice(revenue),             icon: Coins,    gradient: "from-amber-400 to-orange-500"   },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Vue d&apos;ensemble de votre salon</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-xl bg-white border border-neutral-200 p-5 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  {stat.label}
                </span>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${stat.gradient} text-white shadow-sm`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-neutral-900 tracking-tight">
                {stat.value}
              </p>
              <div className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r ${stat.gradient} transition-all duration-300 group-hover:w-full`} />
            </div>
          );
        })}
      </div>

      {/* Appointments with filter tabs */}
      <div className="rounded-xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-900 shrink-0">Rendez-vous récents</h2>
          <span className="text-xs text-neutral-400 font-medium shrink-0">
            {filteredAppointments.length} résultat{filteredAppointments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-0 overflow-x-auto hide-scrollbar">
          {STATUS_TABS.map((tab) => {
            const count = countByStatus[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                    isActive ? "bg-white/25 text-white" : "bg-neutral-100 text-neutral-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="p-4">
          {filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Calendar className="h-10 w-10 text-neutral-200 mb-3" />
              <p className="text-sm text-neutral-400 font-medium">
                Aucun rendez-vous{activeTab !== "ALL" ? ` ${getStatusLabel(activeTab).toLowerCase()}` : ""}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-neutral-50 border border-neutral-100 hover:border-violet-200 hover:bg-violet-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 font-bold text-sm">
                      {apt.client?.name ? apt.client.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {apt.client?.name || "Client inconnu"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Scissors className="h-3 w-3" />
                          {apt.service?.name || "—"}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {apt.barber?.user?.name || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-semibold text-neutral-700">{formatDate(apt.date)}</p>
                      <p className="text-xs text-neutral-400 flex items-center gap-1 justify-end mt-0.5">
                        <Clock className="h-3 w-3" />
                        {formatTime(apt.startTime)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getStatusColor(apt.status)}`}>
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