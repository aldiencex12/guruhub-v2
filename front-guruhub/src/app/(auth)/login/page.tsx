"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { GraduationCap, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

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

      // Mengatasi response mentah atau yang dibungkus oleh data envelope
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
      const message = err.message ?? '';
      if (message.includes('Failed to fetch')) {
        toast.error('Tidak dapat terhubung ke server. Periksa koneksi jaringan.');
      } else {
        toast.error(message || 'Gagal masuk. Email atau password salah.');
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-indigo-400/10 blur-2xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-start p-16 text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold">GuruHub</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Platform Digital
            <br />
            <span className="text-indigo-200">Manajemen Sekolah</span>
          </h1>
          <p className="text-lg text-indigo-100 mb-8 max-w-sm leading-relaxed">
            Kelola guru, siswa, absensi, penilaian, dan rapor dalam satu platform terintegrasi.
          </p>
          <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
            {[
              { label: "Guru", value: "50+" },
              { label: "Siswa", value: "500+" },
              { label: "Kelas", value: "15+" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-indigo-200 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">GuruHub</span>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Masuk ke GuruHub</h2>
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                Masukkan kredensial Anda untuk mengakses dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="guru@sekolah.sch.id"
                    className="pl-10"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
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
                  <p className="text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" loading={isSubmitting} id="login-button">
                {isSubmitting ? "Memproses..." : "Masuk"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
