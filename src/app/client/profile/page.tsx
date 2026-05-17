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
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <Card className="overflow-hidden border-none shadow-lg">
        <div className="h-32 bg-gradient-to-r from-violet-600 to-violet-800" />
        <div className="relative px-6 pb-6">
          <div className="absolute -top-12 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-violet-500 to-violet-600 text-3xl font-bold text-white shadow-lg dark:border-neutral-900">
            {name.charAt(0).toUpperCase()}
          </div>
          <CardHeader className="pb-4 pt-16 pl-0">
            <CardTitle className="text-2xl">Mon profil</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <User className="h-4 w-4" />
                  Nom complet
                </label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 XX XX XX XX" />
              </div>
              <Button type="submit" disabled={saving} className="w-full gap-2" size="lg">
                <Save className="h-4 w-4" />
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
