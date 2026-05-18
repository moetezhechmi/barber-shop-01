"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Save, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setName(d.user.name || "");
          setEmail(d.user.email || "");
          setPhone(d.user.phone || "");
        }
      })
      .catch(() => toast("Erreur lors du chargement", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      toast("Profil mis à jour avec succès", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-32">
      {/* Hero Section */}
      <div className="relative bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="h-56 bg-neutral-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md transition-colors hover:bg-white/40 shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="mx-auto max-w-2xl px-5 relative -mt-12 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-violet-500 to-indigo-600 text-4xl font-extrabold text-white shadow-xl dark:border-neutral-900 overflow-hidden">
              {name ? name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white truncate">Mon Profil</h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                Gérez vos informations personnelles
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card className="overflow-hidden border-none shadow-xl bg-white dark:bg-neutral-900 rounded-3xl">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <User className="h-4 w-4 text-violet-500" />
                  Nom complet
                </label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Votre nom" 
                  className="h-12 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-violet-500 px-4"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <Mail className="h-4 w-4 text-violet-500" />
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                  className="h-12 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-violet-500 px-4"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  <Phone className="h-4 w-4 text-violet-500" />
                  Téléphone
                </label>
                <Input 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="+33 6 XX XX XX XX" 
                  className="h-12 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-violet-500 px-4"
                />
              </div>
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <Button type="submit" disabled={saving} className="w-full gap-2 rounded-2xl py-6 text-base font-bold shadow-lg shadow-violet-500/20" size="lg">
                  <Save className="h-5 w-5" />
                  {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
