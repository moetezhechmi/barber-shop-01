"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Clock, Users, TrendingUp, Scissors } from "lucide-react";
import { getStatusColor, getStatusLabel, formatTime } from "@/lib/utils";

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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonday(d: Date = new Date()): string {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return getLocalDate(monday);
}

export default function BarberDashboardPage() {
  const [user, setUser] = React.useState<{ id: string } | null>(null);
  const [barber, setBarber] = React.useState<Barber | null>(null);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const today = getLocalDate();
  const weekStart = getMonday();

  React.useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) throw new Error("Non connecté");
        const { user: me } = await meRes.json();
        if (cancelled) return;
        setUser(me);

        const barberRes = await fetch("/api/barbers");
        if (!barberRes.ok) throw new Error("Erreur lors du chargement du profil");
        const { barbers } = await barberRes.json();
        let myBarber = barbers?.find(
          (b: { userId: string }) => b.userId === me.id
        );
        
        if (!myBarber && me.role === "BARBER") {
          // Automatically create the barber profile if it doesn't exist yet
          const createRes = await fetch("/api/barbers", { method: "POST" });
          if (createRes.ok) {
            const createData = await createRes.json();
            myBarber = createData.barber;
            
            // Re-fetch the barbers list to ensure we have the correct populated object
            const refetchRes = await fetch("/api/barbers");
            if (refetchRes.ok) {
              const refetchData = await refetchRes.json();
              myBarber = refetchData.barbers?.find((b: { userId: string }) => b.userId === me.id);
            }
          }
        }
        
        if (!myBarber) throw new Error("Aucun profil coiffeur trouvé");
        if (cancelled) return;
        setBarber(myBarber);

        const apptRes = await fetch(
          `/api/barbers/${myBarber.id}/appointments`
        );
        if (!apptRes.ok) throw new Error("Erreur lors du chargement des rendez-vous");
        const { appointments: appts } = await apptRes.json();
        if (!cancelled) setAppointments(appts ?? []);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const todayAppts = appointments.filter((a) => a.date === today);
  const pendingCount = appointments.filter(
    (a) => a.status === "PENDING"
  ).length;
  const completedThisWeek = appointments.filter(
    (a) => a.status === "COMPLETED" && a.date >= weekStart && a.date <= today
  );
  const totalClients = new Set(appointments.map((a) => a.clientId)).size;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-pulse">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl border-4 border-violet-200 dark:border-violet-900 border-t-violet-600 dark:border-t-violet-400 animate-spin" />
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">Chargement de votre espace...</p>
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

  const stats = [
    {
      label: "Aujourd'hui",
      value: todayAppts.length.toString(),
      icon: CalendarCheck,
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      label: "En attente",
      value: pendingCount.toString(),
      icon: Clock,
      gradient: "from-amber-400 to-orange-500",
    },
    {
      label: "Terminés (Semaine)",
      value: completedThisWeek.length.toString(),
      icon: TrendingUp,
      gradient: "from-emerald-400 to-emerald-600",
    },
    {
      label: "Total clients",
      value: totalClients.toString(),
      icon: Users,
      gradient: "from-violet-500 to-purple-500",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
          Mon Espace Barbier
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Gérez vos rendez-vous et vos clients de la journée
        </p>
      </div>

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

      <div className="rounded-3xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-neutral-200/50 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-neutral-200/50 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
            Rendez-vous du jour
          </h2>
        </div>
        
        <div className="p-4 sm:p-6">
          {todayAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarCheck className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mb-4" />
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                Aucun rendez-vous aujourd'hui
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {todayAppts.map((appt) => (
                <div
                  key={appt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 hover:border-violet-200 dark:hover:border-violet-900/50 transition-colors shadow-sm"
                >
                  <div className="flex items-start sm:items-center gap-4 flex-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold text-lg">
                      {appt.client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="font-bold text-neutral-900 dark:text-neutral-50 truncate text-lg">
                        {appt.client.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Scissors className="h-3.5 w-3.5" />
                          {appt.service.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t border-neutral-100 dark:border-neutral-800 sm:border-0 pt-4 sm:pt-0">
                    <div className="flex flex-col sm:items-end">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatTime(appt.startTime)} - {formatTime(appt.endTime)}
                      </span>
                    </div>
                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${getStatusColor(appt.status)}`}>
                      {getStatusLabel(appt.status)}
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
