"use client";

import * as React from "react";
import { 
  Clock, Plus, X, ChevronLeft, ChevronRight, 
  Ban, Loader2, UserCircle2, Scissors, Calendar as CalendarIcon, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatTime } from "@/lib/utils";

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
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  client: Client;
  service: Service;
}

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface WorkingHour {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface BarberData {
  id: string;
  userId: string;
  workingHours: WorkingHour[];
}

function getLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEK_DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default function BarberSchedulePage() {
  const { toast } = useToast();
  
  const [barber, setBarber] = React.useState<BarberData | null>(null);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [blocks, setBlocks] = React.useState<TimeSlot[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [weekOffset, setWeekOffset] = React.useState(0);
  
  // Modal states
  const [showBlockModal, setShowBlockModal] = React.useState(false);
  const [blockStartTime, setBlockStartTime] = React.useState("12:00");
  const [blockEndTime, setBlockEndTime] = React.useState("13:00");
  const [savingBlock, setSavingBlock] = React.useState(false);
  
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

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) throw new Error("Non connecté");
      const { user: me } = await meRes.json();

      const barberRes = await fetch("/api/barbers");
      if (!barberRes.ok) throw new Error("Erreur profil");
      const { barbers } = await barberRes.json();
      let myBarber = barbers?.find((b: any) => b.userId === me.id);
      
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
            myBarber = refetchData.barbers?.find((b: any) => b.userId === me.id);
          }
        }
      }
      
      if (!myBarber) throw new Error("Aucun profil coiffeur trouvé");

      const detailRes = await fetch(`/api/barbers/${myBarber.id}`);
      const { barber: detail } = await detailRes.json();
      setBarber(detail);

      const apptRes = await fetch(`/api/barbers/${myBarber.id}/appointments`);
      const data = await apptRes.json();
      setAppointments(data.appointments || []);
      setBlocks(data.blocks || []);

    } catch (err) {
      console.error(err);
      toast(err instanceof Error ? err.message : "Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddBlock = async () => {
    if (!barber) return;
    if (blockStartTime >= blockEndTime) {
      toast("L'heure de fin doit être après l'heure de début", "error");
      return;
    }
    
    setSavingBlock(true);
    try {
      const res = await fetch(`/api/barbers/${barber.id}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDateStr,
          startTime: blockStartTime,
          endTime: blockEndTime,
        })
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout de l'indisponibilité");
      
      toast("Indisponibilité ajoutée", "success");
      setShowBlockModal(false);
      fetchData(); // reload
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setSavingBlock(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!barber || !confirm("Supprimer cette indisponibilité ?")) return;
    try {
      const res = await fetch(`/api/barbers/${barber.id}/blocks?blockId=${blockId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      toast("Indisponibilité supprimée", "success");
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    }
  };

  // Filter items for the selected day
  const dayAppointments = appointments.filter(a => a.date === selectedDateStr && a.status !== "CANCELLED");
  const dayBlocks = blocks.filter(b => b.date === selectedDateStr);

  // Timeline rendering logic
  const START_HOUR = 8;
  const END_HOUR = 20;
  const HOUR_HEIGHT = 80; // pixels per hour
  
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getEventStyle = (start: string, end: string) => {
    const startMins = timeToMinutes(start);
    const endMins = timeToMinutes(end);
    const timelineStartMins = START_HOUR * 60;
    
    const top = ((startMins - timelineStartMins) / 60) * HOUR_HEIGHT;
    const height = ((endMins - startMins) / 60) * HOUR_HEIGHT;
    
    return {
      top: `${Math.max(0, top)}px`,
      height: `${Math.max(20, height)}px`,
    };
  };

  if (loading && !barber) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
            Mon Planning
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Gérez vos rendez-vous et disponibilités
          </p>
        </div>
        <Button onClick={() => setShowBlockModal(true)} className="gap-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 rounded-xl shadow-lg">
          <Ban className="h-4 w-4" />
          Bloquer un créneau
        </Button>
      </div>

      {/* Calendar Strip */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-violet-500" />
            {MONTHS[currentWeekStart.getMonth()]} {currentWeekStart.getFullYear()}
          </h2>
          <div className="flex gap-2">
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
                  className="absolute left-2 right-2 rounded-xl border border-neutral-300 bg-neutral-100/80 backdrop-blur-sm p-3 overflow-hidden dark:border-neutral-700 dark:bg-neutral-800/80 group flex flex-col justify-center"
                  style={{ ...getEventStyle(block.startTime, block.endTime), zIndex: 10 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                      <Ban className="h-4 w-4" />
                      <span className="text-sm font-bold">Indisponible</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 bg-white rounded-lg shadow hover:text-red-500 dark:bg-neutral-700 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 font-medium">{formatTime(block.startTime)} - {formatTime(block.endTime)}</p>
                </div>
              ))}

              {/* Appointments */}
              {dayAppointments.map(appt => {
                const isCompleted = appt.status === "COMPLETED";
                const isConfirmed = appt.status === "CONFIRMED";
                
                return (
                  <div
                    key={appt.id}
                    className={`absolute left-2 right-2 rounded-xl border-l-4 p-3 overflow-hidden shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex flex-col ${
                      isCompleted 
                        ? "border-l-green-500 bg-green-50/90 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50" 
                        : isConfirmed
                          ? "border-l-blue-500 bg-blue-50/90 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50"
                          : "border-l-violet-500 bg-violet-50/90 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900/50"
                    }`}
                    style={{ ...getEventStyle(appt.startTime, appt.endTime), zIndex: 20 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className={`font-bold text-sm truncate ${
                          isCompleted ? "text-green-900 dark:text-green-100" : isConfirmed ? "text-blue-900 dark:text-blue-100" : "text-violet-900 dark:text-violet-100"
                        }`}>
                          {appt.client.name}
                        </p>
                        <div className={`flex items-center gap-1.5 text-xs mt-1 font-medium ${
                          isCompleted ? "text-green-700 dark:text-green-300" : isConfirmed ? "text-blue-700 dark:text-blue-300" : "text-violet-700 dark:text-violet-300"
                        }`}>
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(appt.startTime)} - {formatTime(appt.endTime)}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted ? "bg-green-200/50 text-green-700 dark:bg-green-800/50 dark:text-green-300" : isConfirmed ? "bg-blue-200/50 text-blue-700 dark:bg-blue-800/50 dark:text-blue-300" : "bg-violet-200/50 text-violet-700 dark:bg-violet-800/50 dark:text-violet-300"
                      }`}>
                        {appt.status}
                      </div>
                    </div>
                    <div className={`mt-2 flex items-center gap-1.5 text-xs truncate ${
                      isCompleted ? "text-green-600 dark:text-green-400" : isConfirmed ? "text-blue-600 dark:text-blue-400" : "text-violet-600 dark:text-violet-400"
                    }`}>
                      <Scissors className="h-3.5 w-3.5" />
                      {appt.service.name}
                    </div>
                  </div>
                )
              })}

            </div>
          </div>
        </div>
      </div>

      {/* Add Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setShowBlockModal(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-neutral-900 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-500" />
                Bloquer un créneau
              </h3>
              <button onClick={() => setShowBlockModal(false)} className="rounded-full p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-500 transition-colors dark:bg-neutral-800 dark:hover:bg-neutral-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">Date</label>
                <div className="px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium flex items-center gap-2 border border-neutral-200 dark:border-neutral-700">
                  <CalendarIcon className="h-4 w-4 text-violet-500" />
                  {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">Heure de début</label>
                  <input
                    type="time"
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full rounded-2xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm transition-colors focus:border-violet-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">Heure de fin</label>
                  <input
                    type="time"
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full rounded-2xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm transition-colors focus:border-violet-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleAddBlock} disabled={savingBlock} className="w-full mt-8 rounded-2xl py-6 font-bold gap-2">
              {savingBlock ? <Loader2 className="h-5 w-5 animate-spin" /> : <Ban className="h-5 w-5" />}
              {savingBlock ? "Enregistrement..." : "Bloquer ce créneau"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
