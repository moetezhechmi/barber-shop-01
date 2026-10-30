"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Scissors, Store, Check, KeyRound } from "lucide-react";

const ROLES = [
  {
    value: "CLIENT",
    label: "Client",
    desc: "Je prends des rendez-vous",
    icon: Scissors,
    color: "violet",
  },
  {
    value: "OWNER",
    label: "Gérant",
    desc: "Je gère un salon",
    icon: Store,
    color: "amber",
  },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [role, setRole] = React.useState<"CLIENT" | "OWNER">("CLIENT");
  const [ownerSecret, setOwnerSecret] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const roleRedirect: Record<string, string> = {
    OWNER: "/owner/dashboard",
    BARBER: "/barber/dashboard",
    CLIENT: "/client/search",
  };

  // Password strength
  const strength = React.useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const strengthLabel = ["", "Faible", "Moyen", "Bon", "Fort"][strength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-500"][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (role === "OWNER" && !ownerSecret.trim()) {
      setError("Le code d'activation gérant est obligatoire");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          password,
          role,
          ownerSecret: role === "OWNER" ? ownerSecret.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'inscription");
      router.push(roleRedirect[data.user?.role] || "/client/search");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 flex items-center justify-center px-4 py-12">
      {/* Soft decorative blobs */}
      <div className="pointer-events-none fixed top-[-80px] left-[-80px] h-[400px] w-[400px] rounded-full bg-violet-100 opacity-50 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-[-80px] right-[-80px] h-[400px] w-[400px] rounded-full bg-indigo-100 opacity-50 blur-[100px]" />

      <div className="relative w-full max-w-[440px]">

        {/* Brand header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200 mb-4">
            <Scissors className="h-8 w-8 text-white" strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Créer un compte</h1>
          <p className="mt-1 text-sm text-slate-500">Rejoignez GUI COIF en quelques secondes</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-2.5">Je suis…</p>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(({ value, label, desc, icon: Icon, color }) => {
                const active = role === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`relative flex flex-col items-start gap-1 rounded-xl border-2 p-3.5 text-left transition-all
                      ${active
                        ? color === "violet"
                          ? "border-violet-500 bg-violet-50"
                          : "border-amber-500 bg-amber-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }
                    `}
                  >
                    {active && (
                      <span className={`absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full text-white
                        ${color === "violet" ? "bg-violet-500" : "bg-amber-500"}
                      `}>
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                    )}
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg
                      ${active
                        ? color === "violet" ? "bg-violet-100 text-violet-600" : "bg-amber-100 text-amber-600"
                        : "bg-slate-100 text-slate-500"
                      }
                    `}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{label}</span>
                    <span className="text-[11px] text-slate-400 leading-tight">{desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <span className="mt-px text-red-400">⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Owner Activation Code (Required only if Gérant is selected) */}
            {role === "OWNER" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900">
                  <KeyRound className="h-4 w-4 text-amber-600" />
                  <label htmlFor="ownerSecret" className="block text-xs font-bold uppercase tracking-wider">
                    Code d&apos;activation Gérant <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  id="ownerSecret"
                  type="password"
                  value={ownerSecret}
                  onChange={(e) => setOwnerSecret(e.target.value)}
                  placeholder="Entrez votre clé de licence gérant"
                  required
                  className="w-full rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
                <p className="text-[11px] text-amber-700 leading-snug">
                  Clé confidentielle fournie au propriétaire du salon pour initialiser l&apos;administration.
                </p>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nom complet <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom et prénom"
                required
                autoComplete="name"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-3 focus:ring-violet-100"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Adresse e-mail <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-3 focus:ring-violet-100"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                Téléphone
                <span className="ml-1.5 text-[11px] font-normal text-slate-400">(optionnel)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+216 00 000 000"
                autoComplete="tel"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-3 focus:ring-violet-100"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Mot de passe <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-3 focus:ring-violet-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= strength ? strengthColor : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 w-10 text-right">{strengthLabel}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirmer le mot de passe <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className={`w-full rounded-lg border bg-slate-50 px-4 py-2.5 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-3
                    ${confirmPassword && confirmPassword !== password
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : confirmPassword && confirmPassword === password
                        ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
                        : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
                    }
                  `}
                />
                {confirmPassword && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                    {confirmPassword === password ? "✓" : "✗"}
                  </span>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:from-violet-500 hover:to-indigo-500 hover:shadow-md hover:shadow-violet-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Inscription…
                </>
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Déjà inscrit ?{" "}
          <Link href="/auth/login" className="font-semibold text-violet-600 hover:text-violet-700 transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
