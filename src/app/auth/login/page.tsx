"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ShieldCheck, User, Scissors, Zap } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const roleRedirect: Record<string, string> = {
    OWNER: "/owner/dashboard",
    BARBER: "/barber/dashboard",
    CLIENT: "/client/search",
  };

  React.useEffect(() => {
    let active = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok && active) {
          const { user } = await res.json();
          if (user) router.replace(roleRedirect[user.role] || "/client/search");
        }
      } catch { /* not logged in */ }
    }
    checkAuth();
    return () => { active = false; };
  }, [router]);

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email ou mot de passe incorrect");
      router.push(roleRedirect[data.user?.role] || "/client/search");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    doLogin(email, password);
  };

  const handleDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    doLogin(demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 flex items-center justify-center px-4 py-12">
      {/* Soft decorative blobs */}
      <div className="pointer-events-none fixed top-[-80px] left-[-80px] h-[400px] w-[400px] rounded-full bg-violet-100 opacity-50 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-[-80px] right-[-80px] h-[400px] w-[400px] rounded-full bg-indigo-100 opacity-50 blur-[100px]" />

      <div className="relative w-full max-w-[420px]">

        {/* Brand header — outside card */}
        <div className="mb-8 text-center">
          <div className="relative inline-flex w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-violet-200 mb-4">
            <Image src="/logo.jpg" alt="GUI COIF" fill className="object-cover" priority />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bon retour 👋</h1>
          <p className="mt-1 text-sm text-slate-500">Connectez-vous à votre compte GUI COIF</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">

          {/* Demo shortcuts */}
          <div className="mb-6 rounded-xl bg-slate-50 border border-slate-200 p-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Zap className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Accès démo rapide</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Gérant", sub: "Admin", icon: ShieldCheck, color: "amber", email: "admin@gmail.com" },
                { label: "Barbier", sub: "Staff", icon: Scissors, color: "violet", email: "chacha@gmail.com" },
                { label: "Client", sub: "RDV", icon: User, color: "emerald", email: "client@gmail.com" },
              ].map(({ label, sub, icon: Icon, color, email: demoEmail }) => (
                <button
                  key={label}
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemo(demoEmail, "123456")}
                  className={`group flex flex-col items-center gap-1 rounded-lg border bg-white p-2.5 text-center transition-all hover:shadow-sm active:scale-95 disabled:opacity-50
                    ${color === "amber" ? "border-amber-100 hover:border-amber-200 hover:bg-amber-50" : ""}
                    ${color === "violet" ? "border-violet-100 hover:border-violet-200 hover:bg-violet-50" : ""}
                    ${color === "emerald" ? "border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50" : ""}
                  `}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg
                    ${color === "amber" ? "bg-amber-100 text-amber-600" : ""}
                    ${color === "violet" ? "bg-violet-100 text-violet-600" : ""}
                    ${color === "emerald" ? "bg-emerald-100 text-emerald-600" : ""}
                  `}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">{label}</span>
                  <span className="text-[10px] text-slate-400">{sub}</span>
                </button>
              ))}
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
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Adresse e-mail
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Mot de passe
                </label>
                <Link href="#" className="text-xs font-medium text-violet-500 hover:text-violet-600 transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-3 focus:ring-violet-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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
                  Connexion…
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Pas encore de compte ?{" "}
          <Link href="/auth/register" className="font-semibold text-violet-600 hover:text-violet-700 transition-colors">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
