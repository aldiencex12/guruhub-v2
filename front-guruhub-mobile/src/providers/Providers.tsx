"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { registerAlertCallback } from "@/utils/alert";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 menit
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }));

  // Alert State
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info">("success");

  useEffect(() => {
    registerAlertCallback((title, message, type = "success") => {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertType(type);
      setAlertOpen(true);
    });
    return () => {
      registerAlertCallback(null);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* Custom Premium Alert Modal */}
      {alertOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300">
          <div 
            className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl w-full max-w-[320px] p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated Icon Circle */}
            <div className={`p-4 rounded-full mb-4 ${
              alertType === "success" 
                ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400" 
                : alertType === "error"
                ? "bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400"
                : "bg-indigo-50 text-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400"
            }`}>
              {alertType === "success" && <CheckCircle2 className="h-10 w-10 animate-bounce" />}
              {alertType === "error" && <XCircle className="h-10 w-10 animate-pulse" />}
              {alertType === "info" && <AlertCircle className="h-10 w-10 animate-spin" />}
            </div>

            {/* Title */}
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
              {alertTitle}
            </h3>

            {/* Message */}
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-[220px]">
              {alertMessage}
            </p>

            {/* OK Button */}
            <button
              onClick={() => setAlertOpen(false)}
              className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-500/10"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </QueryClientProvider>
  );
}
