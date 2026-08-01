"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeInputProps {
  value?: string; // format "HH:MM"
  onChange?: (value: string) => void;
  className?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
}

const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

export const TimeInput = React.forwardRef<HTMLDivElement, TimeInputProps>(
  ({ value = "07:00", onChange, className, name, id, disabled }, ref) => {
    const [hour, setHour] = React.useState(() => (value ? value.split(":")[0] : "07"));
    const [minute, setMinute] = React.useState(() =>
      value ? (value.split(":")[1] || "00").substring(0, 2) : "00"
    );
    const [focused, setFocused] = React.useState(false);

    // Sync from external value changes (e.g. when editing existing schedule)
    React.useEffect(() => {
      if (value) {
        const parts = value.split(":");
        setHour(parts[0] || "07");
        setMinute((parts[1] || "00").substring(0, 2));
      }
    }, [value]);

    const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newHour = e.target.value;
      setHour(newHour);
      onChange?.(`${newHour}:${minute}`);
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newMinute = e.target.value;
      setMinute(newMinute);
      onChange?.(`${hour}:${newMinute}`);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "group relative flex items-center gap-0 h-10 rounded-lg border bg-white text-sm transition-all duration-200",
          "shadow-sm hover:shadow-md",
          focused
            ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-indigo-100"
            : "border-gray-200 hover:border-indigo-300",
          "dark:bg-gray-900 dark:border-gray-700 dark:hover:border-indigo-600",
          focused && "dark:ring-indigo-500/30 dark:border-indigo-500",
          disabled && "cursor-not-allowed opacity-50 hover:shadow-sm",
          className
        )}
      >
        {/* Hidden input for react-hook-form */}
        {name && (
          <input type="hidden" name={name} id={id} value={`${hour}:${minute}`} />
        )}

        {/* Clock icon */}
        <div className={cn(
          "flex items-center justify-center pl-3 pr-1 transition-colors",
          focused ? "text-indigo-500" : "text-gray-400 group-hover:text-indigo-400"
        )}>
          <Clock className="h-4 w-4" />
        </div>

        {/* Hour selector */}
        <select
          value={hour}
          onChange={handleHourChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          className={cn(
            "bg-transparent border-0 outline-none cursor-pointer font-mono font-semibold text-sm appearance-none focus:outline-none pl-1 pr-0.5",
            focused ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-200"
          )}
          aria-label="Jam"
        >
          {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        {/* Separator */}
        <span className={cn(
          "font-bold text-base select-none leading-none pb-0.5 transition-colors",
          focused ? "text-indigo-500" : "text-gray-400"
        )}>
          .
        </span>

        {/* Minute selector */}
        <select
          value={minute}
          onChange={handleMinuteChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          className={cn(
            "bg-transparent border-0 outline-none cursor-pointer font-mono font-semibold text-sm appearance-none focus:outline-none pl-0.5 pr-1",
            focused ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-200"
          )}
          aria-label="Menit"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* WIB badge */}
        <div className={cn(
          "ml-1 mr-2.5 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider transition-colors select-none",
          focused
            ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
            : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
        )}>
          WIB
        </div>
      </div>
    );
  }
);
TimeInput.displayName = "TimeInput";
