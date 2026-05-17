"use client";

import * as React from "react";
import { 
  Clock, ChevronLeft, ChevronRight, Check, X,
  Loader2, UserCircle2, Scissors, Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { formatTime, formatDate, getStatusColor, getStatusLabel, formatPrice } from "@/lib/utils";

// Types
interface Client {
  id: string;
  name: string;
  email: string;
}

interface BarberUser {
  id: string;
  name: string;
  image: string | null;
}

interface Barber {
  id: string;
  userId: string;
  isApproved: boolean;
  user: BarberUser;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface TimeSlot {
  id: string;
  barberId: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Appointment {
  id: string;
  clientId: string;
  barberId: string;
  shopId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  createdAt: string;
  client: Client;
  barber: Barber;
  service: Service;
  shop: { id: string; name: string };
}

function getLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEK_DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default function OwnerAppointmentsPage() {
  const { toast } = useToast();
  
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [blocks, setBlocks] = React.useState<TimeSlot[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [selectedBarberId, setSelectedBarberId] = React.useState<string>("ALL");
  
  const [viewingAppointment, setViewingAppointment] = React.useState<Appointment | null>(null);

  const selectedDateStr = getLocalDateStr(selectedDate);
  const currentWeekStart = new Date();
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1 + (weekOffset * 7)); // Monday start
  
  const weekDates = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentWeekStart, weekOffset]);

  const loadAppointments = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      if (!res.ok) throw new Error("Erreur lors du chargement des rendez-vous");
      const data = await res.json();
      setAppointments(data.appointments || []);
      setBlocks(data.blocks || []);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Une erreur est survenue", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur lors de la mise à jour");
      }

      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status } : a))
      );
      
      if (viewingAppointment && viewingAppointment.id === appointmentId) {
        setViewingAppointment({ ...viewingAppointment, status });
      }

      toast(`Rendez-vous ${getStatusLabel(status).toLowerCase()} avec succès`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur lors de la mise à jour", "error");
    }
  };

  // Get unique barbers from appointments
  const barbers = React.useMemo(() => {
    const map = new Map<string, Barber>();
    appointments.forEach(a => {
      if (a.barber && !map.has(a.barber.id)) {
        map.set(a.barber.id, a.barber);
      }
    });
    return Array.from(map.values());
  }, [appointments]);

  // Filter items for the selected day and barber
  const dayAppointments = appointments.filter(a => {
    if (a.date !== selectedDateStr) return false;
    if (selectedBarberId !== "ALL" && a.barberId !== selectedBarberId) return false;
    return true;
  });

  const dayBlocks = blocks.filter(b => {
    if (b.date !== selectedDateStr) return false;
    if (selectedBarberId !== "ALL" && b.barberId !== selectedBarberId) return false;
    return true;
  });

  // Timeline rendering logic
  const START_HOUR = 8;
  const END_HOUR = 20;
  const HOUR_HEIGHT = 80; // pixels per hour
  
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getEventStyle = (start: string, end: string, index: number, total: number) => {
    const startMins = timeToMinutes(start);
    const endMins = timeToMinutes(end);
    const timelineStartMins = START_HOUR * 60;
    
    const top = ((startMins - timelineStartMins) / 60) * HOUR_HEIGHT;
    const height = ((endMins - startMins) / 60) * HOUR_HEIGHT;
    
    // If there are overlapping appointments (e.g., when viewing "ALL" barbers), we could offset them.
    // For simplicity, we just slightly offset them horizontally based on index if total > 1
    const width = total > 1 ? `${100 / total}%` : 'auto';
    const left = total > 1 ? `calc(0.5rem + ${index * (100 / total)}%)` : '0.5rem';
    const right = total > 1 ? 'auto' : '0.5rem';
    
    return {
      top: `${Math.max(0, top)}px`,
      height: `${Math.max(20, height)}px`,
      left,
      right,
      width: total > 1 ? `calc(${width} - 1rem)` : 'auto',
    };
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
            Rendez-vous du salon
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Visualisez et gérez le planning de vos barbiers
          </p>
        </div>
      </div>

      {/* Calendar Strip */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 px-2 gap-4">
          <h2 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-violet-500" />
            {MONTHS[currentWeekStart.getMonth()]} {currentWeekStart.getFullYear()}
          </h2>
          <div className="flex gap-2 self-end sm:self-auto">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <ChevronLeft className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </button>
            <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-sm font-semibold rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 hover:bg-violet-200 transition-colors">
              Aujourd'hui
            </button>
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <ChevronRight className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const isSelected = getLocalDateStr(date) === selectedDateStr;
            const isToday = getLocalDateStr(date) === getLocalDateStr(new Date());
            
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
                  isSelected 
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20 scale-105" 
                    : isToday
                      ? "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-400"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                }`}
              >
                <span className={`text-xs font-medium mb-1 ${isSelected ? "text-violet-100" : "opacity-70"}`}>
                  {WEEK_DAYS[date.getDay()]}
                </span>
                <span className={`text-lg font-bold ${isSelected ? "text-white" : ""}`}>
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barbers Filter */}
      {barbers.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 hide-scrollbar">
          <button
            onClick={() => setSelectedBarberId("ALL")}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              selectedBarberId === "ALL"
                ? "bg-neutral-900 text-white shadow-md dark:bg-white dark:text-neutral-900"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400"
            }`}
          >
            Tous les barbiers
          </button>
          {barbers.map(barber => (
            <button
              key={barber.id}
              onClick={() => setSelectedBarberId(barber.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedBarberId === barber.id
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400"
              }`}
            >
              <UserCircle2 className="h-4 w-4" />
              {barber.user.name}
            </button>
          ))}
        </div>
      )}

      {/* Daily Timeline View */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-between items-center">
          <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            Programme du {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <div className="text-sm text-neutral-500">
            {dayAppointments.length} rendez-vous
          </div>
        </div>
        
        <div className="relative overflow-y-auto max-h-[600px] hide-scrollbar" style={{ minHeight: '400px' }}>
          <div className="relative" style={{ height: `${(END_HOUR - START_HOUR + 1) * HOUR_HEIGHT}px` }}>
            {/* Time markers background */}
            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
              <div key={i} className="absolute w-full flex items-start border-b border-neutral-100 dark:border-neutral-800" style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                <div className="w-16 shrink-0 pt-2 pr-4 text-right text-xs font-medium text-neutral-400">
                  {START_HOUR + i}:00
                </div>
                <div className="flex-1 h-full border-l border-neutral-100 dark:border-neutral-800"></div>
              </div>
            ))}

            {/* Events Container */}
            <div className="absolute top-0 bottom-0 left-16 right-4">
              
              {/* Blocks */}
              {dayBlocks.map(block => (
                <div
                  key={block.id}
                  className="absolute rounded-xl border border-neutral-300 bg-neutral-100/80 backdrop-blur-sm p-2 overflow-hidden dark:border-neutral-700 dark:bg-neutral-800/80 flex flex-col justify-center text-center opacity-80"
                  style={{ ...getEventStyle(block.startTime, block.endTime, 0, selectedBarberId === "ALL" ? dayBlocks.length : 1), zIndex: 10 }}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                      Indisponible
                    </span>
                    {selectedBarberId === "ALL" && (
                       <span className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1">
                          <UserCircle2 className="h-3 w-3" />
                          {barbers.find(b => b.id === block.barberId)?.user?.name || "Barbier"}
                       </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Appointments */}
              {dayAppointments.map((appt, idx) => {
                const isCompleted = appt.status === "COMPLETED";
                const isConfirmed = appt.status === "CONFIRMED";
                const isCancelled = appt.status === "CANCELLED";
                
                // Group overlapping appointments for the offset logic if 'ALL' is selected
                // Here we simplify by assuming they all overlap if there's more than one at the same time
                const overlapping = dayAppointments.filter(a => a.startTime === appt.startTime && a.id !== appt.id);
                const totalInSlot = overlapping.length + 1;
                const indexInSlot = [appt, ...overlapping].sort((a,b) => a.id.localeCompare(b.id)).findIndex(a => a.id === appt.id);

                return (
                  <button
                    key={appt.id}
                    onClick={() => setViewingAppointment(appt)}
                    className={`absolute text-left rounded-xl border-l-4 p-2 overflow-hidden shadow-sm transition-all hover:shadow-md hover:scale-[1.01] hover:z-30 flex flex-col ${
                      isCancelled
                        ? "border-l-red-500 bg-red-50/90 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 opacity-70"
                        : isCompleted 
                          ? "border-l-green-500 bg-green-50/90 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50" 
                          : isConfirmed
                            ? "border-l-blue-500 bg-blue-50/90 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50"
                            : "border-l-violet-500 bg-violet-50/90 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900/50"
                    }`}
                    style={{ ...getEventStyle(appt.startTime, appt.endTime, indexInSlot, selectedBarberId === "ALL" ? totalInSlot : 1), zIndex: 20 }}
                  >
                    <div className="flex items-start justify-between gap-1 w-full">
                      <div className="min-w-0 flex-1">
                        <p className={`font-bold text-xs sm:text-sm truncate ${
                          isCancelled ? "text-red-900 dark:text-red-100" : isCompleted ? "text-green-900 dark:text-green-100" : isConfirmed ? "text-blue-900 dark:text-blue-100" : "text-violet-900 dark:text-violet-100"
                        }`}>
                          {appt.client.name}
                        </p>
                        <div className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs mt-0.5 font-medium ${
                          isCancelled ? "text-red-700 dark:text-red-300" : isCompleted ? "text-green-700 dark:text-green-300" : isConfirmed ? "text-blue-700 dark:text-blue-300" : "text-violet-700 dark:text-violet-300"
                        }`}>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3 hidden sm:block" />{formatTime(appt.startTime)}</span>
                          {selectedBarberId === "ALL" && (
                            <span className="flex items-center gap-1 truncate"><UserCircle2 className="h-3 w-3 hidden sm:block"/>{appt.barber.user.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}

            </div>
          </div>
        </div>
      </div>

      {/* Appointment Details Modal */}
      <Modal
        isOpen={!!viewingAppointment}
        onClose={() => setViewingAppointment(null)}
        title="Détails du rendez-vous"
      >
        {viewingAppointment && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <Badge className={`px-3 py-1.5 text-xs font-bold ${getStatusColor(viewingAppointment.status)}`}>
                {getStatusLabel(viewingAppointment.status)}
              </Badge>
              <div className="text-right">
                <p className="text-sm font-bold text-neutral-900 dark:text-white">{formatDate(viewingAppointment.date)}</p>
                <p className="text-xs text-neutral-500">{formatTime(viewingAppointment.startTime)} - {formatTime(viewingAppointment.endTime)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Client</p>
                <p className="font-bold text-neutral-900 dark:text-white truncate">{viewingAppointment.client?.name}</p>
                <p className="text-xs text-neutral-500 truncate">{viewingAppointment.client?.email}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Barbier</p>
                <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <UserCircle2 className="h-4 w-4 text-violet-500" />
                  {viewingAppointment.barber?.user?.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Prestation</p>
                <p className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Scissors className="h-4 w-4 text-violet-500" />
                  {viewingAppointment.service?.name}
                </p>
                <p className="text-xs text-violet-600 font-bold mt-0.5">{formatPrice(viewingAppointment.service?.price || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Salon</p>
                <p className="font-bold text-neutral-900 dark:text-white">{viewingAppointment.shop?.name}</p>
              </div>
            </div>

            {viewingAppointment.notes && (
              <div>
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Notes du client</p>
                <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
                  {viewingAppointment.notes}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              {viewingAppointment.status === "PENDING" && (
                <Button
                  onClick={() => handleUpdateStatus(viewingAppointment.id, "CONFIRMED")}
                  className="w-full gap-2 rounded-xl py-6 font-bold shadow-lg shadow-violet-500/20 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                >
                  <Check className="h-5 w-5" />
                  Confirmer le rendez-vous
                </Button>
              )}
              
              {(viewingAppointment.status === "PENDING" || viewingAppointment.status === "CONFIRMED") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if(confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) {
                      handleUpdateStatus(viewingAppointment.id, "CANCELLED");
                    }
                  }}
                  className="w-full gap-2 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 dark:border-red-900/50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                  Annuler le rendez-vous
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
