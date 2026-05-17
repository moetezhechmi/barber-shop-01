"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  getStatusColor,
  getStatusLabel,
  formatDate,
  formatTime,
} from "@/lib/utils";
import { CheckCircle, XCircle, CheckCheck } from "lucide-react";

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

const TABS = [
  { key: "ALL", label: "Tous" },
  { key: "PENDING", label: "En attente" },
  { key: "CONFIRMED", label: "Confirmés" },
  { key: "COMPLETED", label: "Terminés" },
  { key: "CANCELLED", label: "Annulés" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function BarberAppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabKey>("ALL");
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) throw new Error("Non connecté");
        const { user: me } = await meRes.json();

        const barberRes = await fetch("/api/barbers");
        if (!barberRes.ok) throw new Error("Erreur profil coiffeur");
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
        
        if (!myBarber) throw new Error("Aucun profil coiffeur");

        const apptRes = await fetch(
          `/api/barbers/${myBarber.id}/appointments`
        );
        if (!apptRes.ok) throw new Error("Erreur chargement rendez-vous");
        const { appointments: appts } = await apptRes.json();
        if (!cancelled) setAppointments(appts ?? []);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Une erreur est survenue"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function updateStatus(
    appointmentId: string,
    status: "CONFIRMED" | "COMPLETED" | "CANCELLED"
  ) {
    setActionLoading(appointmentId);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error);
        throw new Error(msg);
      }
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status } : a
        )
      );
      toast(
        `Rendez-vous ${getStatusLabel(status).toLowerCase()} avec succès`,
        "success"
      );
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur lors de la mise à jour",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = React.useMemo(() => {
    if (activeTab === "ALL") return appointments;
    return appointments.filter((a) => a.status === activeTab);
  }, [appointments, activeTab]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-neutral-900 dark:border-neutral-50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
        Gestion des rendez-vous
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-neutral-200 pb-px dark:border-neutral-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-neutral-900 text-neutral-900 dark:border-neutral-50 dark:text-neutral-50"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
            }`}
          >
            {tab.label}
            {tab.key !== "ALL" &&
              appointments.filter((a) => a.status === tab.key).length > 0 && (
                <span className="ml-1.5 text-xs text-neutral-400">
                  ({appointments.filter((a) => a.status === tab.key).length})
                </span>
              )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            Aucun rendez-vous
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((appt) => (
            <Card key={appt.id}>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                        {appt.client.name}
                      </p>
                      <Badge className={getStatusColor(appt.status)}>
                        {getStatusLabel(appt.status)}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-neutral-500">
                      <p>
                        {appt.service.name} &middot;{" "}
                        {appt.service.duration} min &middot;{" "}
                        {appt.service.price.toFixed(2)} &euro;
                      </p>
                      <p>
                        {formatDate(appt.date)} &middot;{" "}
                        {formatTime(appt.startTime)} &ndash;{" "}
                        {formatTime(appt.endTime)}
                      </p>
                      {appt.notes && (
                        <p className="italic">
                          Note : {appt.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {appt.status === "PENDING" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(appt.id, "CONFIRMED")}
                        disabled={actionLoading === appt.id}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accepter
                      </Button>
                    )}
                    {appt.status === "CONFIRMED" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus(appt.id, "COMPLETED")}
                        disabled={actionLoading === appt.id}
                      >
                        <CheckCheck className="h-4 w-4" />
                        Terminer
                      </Button>
                    )}
                    {(appt.status === "PENDING" ||
                      appt.status === "CONFIRMED") && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(appt.id, "CANCELLED")}
                        disabled={actionLoading === appt.id}
                      >
                        <XCircle className="h-4 w-4" />
                        Annuler
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
