"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Download, Eye, EyeOff, Lock, Mail, Smartphone } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Detect standalone mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

    // Detect iOS Device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);

    if (isIOSDevice && !isStandalone) {
      setIsIOS(true);
    }

    if (isStandalone) {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await authService.login(data.email, data.password);
      
      const payload = res.data || res;
      const user = payload.user;
      const accessToken = payload.accessToken;
      const refreshToken = payload.refreshToken;

      if (!user || !accessToken || !refreshToken) {
        throw new Error("Respons login tidak lengkap dari server");
      }

      login(user, accessToken, refreshToken);
      toast.success("Login berhasil! Selamat datang kembali.");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Gagal masuk. Email atau password salah.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
        {/* App Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl shadow-sm mb-3">
            <img
              src="/logo-hangtuah.png"
              alt="School Logo"
              className="h-14 w-14 object-contain filter drop-shadow-[0_2px_8px_rgba(79,70,229,0.15)]"
            />
          </div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400 dark:from-indigo-400 dark:to-indigo-300 tracking-tight">
            GuruHub Mobile
          </h2>
          <p className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400 dark:text-gray-500 mt-1.5">
            SMP Hang Tuah 5 Sidoarjo
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="email"
                type="email"
                placeholder="guru@sekolah.sch.id"
                className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-[10px] text-red-600 mt-0.5">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] text-red-600 mt-0.5">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-sm transition-colors mt-6 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        {/* Custom PWA Install Shortcut for Android/Chrome/Desktop */}
        {showInstallBtn && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20"
            >
              <Download className="h-3.5 w-3.5" /> Pasang Aplikasi GuruHub PWA
            </button>
          </div>
        )}

        {/* Custom PWA Instructions for iOS/Safari */}
        {isIOS && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3.5 text-[11px] text-indigo-800 dark:text-indigo-300">
              <p className="font-bold mb-1 flex items-center justify-center gap-1.5 text-xs text-indigo-900 dark:text-indigo-200">
                <Smartphone className="h-3.5 w-3.5" /> Pasang di iPhone/iPad
              </p>
              <p className="leading-relaxed">
                Ketuk ikon <strong className="font-semibold text-indigo-900 dark:text-indigo-200">Share</strong> (panah kotak) di Safari, lalu pilih <strong className="font-semibold text-indigo-900 dark:text-indigo-200">"Tambahkan ke Layar Utama"</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
