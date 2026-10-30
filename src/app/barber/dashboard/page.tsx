"use client";

import * as React from "react";
import { CalendarCheck, Clock, Users, TrendingUp, Scissors, CheckCircle, CheckCheck } from "lucide-react";
import { getStatusColor, getStatusLabel, formatTime } from "@/lib/utils";
import { useBarberStore } from "@/store/barber.store";

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Appointment {
  id: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  client: Client;
  service: Service;
}

interface Barber {
  id: string;
  userId: string;
  shopId: string;
}

function getLocalDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonday(d: Date = new Date()): string {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return getLocalDate(monday);
}

const STATUS_TABS = [
  { key: "ALL",       label: "Tous" },
  { key: "PENDING",   label: "En attente" },
  { key: "CONFIRMED", label: "Confirmés" },
  { key: "COMPLETED", label: "Terminés" },
  { key: "CANCELLED", label: "Annulés" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["key"];

export default function BarberDashboardPage() {
  const { barber, fetchBarber } = useBarberStore();
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<StatusTab>("ALL");

  const today = getLocalDate();
  const weekStart = getMonday();

  React.useEffect(() => { fetchBarber(); }, [fetchBarber]);

  React.useEffect(() => {
    if (!barber) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/barbers/${barber.id}/appointments`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Erreur chargement")))
      .then(data => { if (!cancelled) setAppointments(data.appointments ?? []); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [barber]);

  const todayAppts = appointments.filter((a) => a.date === today);
  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;
  const completedThisWeek = appointments.filter(
    (a) => a.status === "COMPLETED" && a.date >= weekStart && a.date <= today
  );
  const totalClients = new Set(appointments.map((a) => a.clientId)).size;

  const filteredToday = React.useMemo(() => {
    if (activeTab === "ALL") return todayAppts;
    return todayAppts.filter((a) => a.status === activeTab);
  }, [todayAppts, activeTab]);

  const countByStatus = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of STATUS_TABS) {
      counts[tab.key] = tab.key === "ALL"
        ? todayAppts.length
        : todayAppts.filter((a) => a.status === tab.key).length;
    }
    return counts;
  }, [todayAppts]);

  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const updateStatus = React.useCallback(async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: data.appointment?.status ?? status } : a))
      );
    } catch {
      // silent
    } finally {
      setUpdatingId(null);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="h-10 w-10 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin" />
        <p className="text-sm text-neutral-400 font-medium">Chargement de votre espace…</p>
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

  const stats = [
    { label: "Aujourd'hui",       value: todayAppts.length.toString(),       icon: CalendarCheck, gradient: "from-blue-500 to-indigo-500"    },
    { label: "En attente",        value: pendingCount.toString(),             icon: Clock,         gradient: "from-amber-400 to-orange-500"   },
    { label: "Terminés (Semaine)",value: completedThisWeek.length.toString(), icon: TrendingUp,    gradient: "from-emerald-400 to-emerald-600"},
    { label: "Total clients",     value: totalClients.toString(),             icon: Users,         gradient: "from-violet-500 to-purple-500"  },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Mon Espace Barbier</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Gérez vos rendez-vous et clients du jour</p>
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

      {/* Today appointments with filter */}
      <div className="rounded-xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-900 shrink-0">Rendez-vous du jour</h2>
          <span className="text-xs text-neutral-400 font-medium shrink-0">
            {filteredToday.length} résultat{filteredToday.length !== 1 ? "s" : ""}
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
          {filteredToday.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarCheck className="h-10 w-10 text-neutral-200 mb-3" />
              <p className="text-sm text-neutral-400 font-medium">
                {activeTab === "ALL"
                  ? "Aucun rendez-vous aujourd\u2019hui"
                  : `Aucun rendez-vous ${getStatusLabel(activeTab).toLowerCase()} aujourd\u2019hui`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredToday.map((appt) => (
                <div
                  key={appt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-neutral-50 border border-neutral-100 hover:border-violet-200 hover:bg-violet-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 font-bold text-sm">
                      {appt.client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{appt.client.name}</p>
                      <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Scissors className="h-3 w-3" />
                        {appt.service.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-shrink-0">
                    <p className="text-xs font-semibold text-neutral-600 hidden sm:block">
                      {formatTime(appt.startTime)} \u2013 {formatTime(appt.endTime)}
                    </p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getStatusColor(appt.status)}`}>
                      {getStatusLabel(appt.status)}
                    </span>
                    {appt.status === "PENDING" && (
                      <button
                        onClick={() => updateStatus(appt.id, "CONFIRMED")}
                        disabled={updatingId === appt.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Accepter
                      </button>
                    )}
                    {appt.status === "CONFIRMED" && (
                      <button
                        onClick={() => updateStatus(appt.id, "COMPLETED")}
                        disabled={updatingId === appt.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Terminer
                      </button>
                    )}
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