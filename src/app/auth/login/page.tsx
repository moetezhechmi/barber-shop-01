"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scissors, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Email ou mot de passe incorrect");
      }

      const target = roleRedirect[data.user?.role] || "/client/search";
      router.push(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === "Google") {
      setLoading(true);
      setError(null);
      try {
        await signIn("google", { callbackUrl: "/client/search" });
      } catch (err) {
        setError("Une erreur est survenue lors de l'authentification Google");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070708] px-4 font-sans sm:px-6 lg:px-8 py-10">
      {/* Background Glows */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-violet-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-3xl bg-neutral-900/40 border border-neutral-800 rounded-[32px] p-8 sm:p-10 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20 border border-white/10 transform hover:scale-105 transition-transform duration-300">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center justify-center gap-2">
              Bon retour <Sparkles className="h-4 w-4 text-violet-400" />
            </h1>
            
            <p className="text-sm text-neutral-400">
              Connectez-vous pour accéder à BarberPro
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                {error}
              </div>
            )}
            
            {/* Input Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 ml-1">
                Adresse Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-300"
              />
            </div>
            
            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Mot de passe
                </label>
                <Link href="#" className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  required
                  className="w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl px-4 py-3 pr-12 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500 hover:text-white transition-colors rounded-lg"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-violet-600/20 transform transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Social Logins Divider */}
            <div className="relative my-6 py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-850" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0b0c0e] px-3 py-1 rounded-full border border-neutral-800/80 text-[10px] tracking-widest font-bold text-neutral-500">
                  Ou continuer avec
                </span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin("Google")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-850 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <GoogleIcon className="h-5 w-5" />
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("Facebook")}
                className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-950/40 hover:bg-neutral-850 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <FacebookIcon className="h-5 w-5" />
                <span>Facebook</span>
              </button>
            </div>
            
            {/* Register Link */}
            <div className="pt-6 border-t border-neutral-800/80 text-center">
              <p className="text-xs text-neutral-400">
                Pas encore de compte ?{" "}
                <Link
                  href="/auth/register"
                  className="font-bold text-white hover:text-violet-400 transition-colors"
                >
                  S'inscrire maintenant
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
