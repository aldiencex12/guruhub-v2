"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export function LoadingState({ message = "Memuat data...", rows = 3 }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 w-full text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      {rows > 0 && (
        <div className="w-full space-y-2 mt-4 max-w-xl">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="h-10 bg-muted/60 rounded-md animate-pulse w-full"
            />
          ))}
        </div>
      )}
    </div>
  );
}
