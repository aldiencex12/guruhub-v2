"use client";

import { useState, useMemo } from "react";
import { Search, X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string | number;
  label: string;
  sublabel?: string;
}

interface SearchableSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: Option[];
  selectedValue: string | number;
  onSelect: (value: string | number) => void;
  placeholder?: string;
}

export function SearchableSelectModal({
  isOpen,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  placeholder = "Cari...",
}: SearchableSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet Box */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden z-10 animate-in slide-in-from-bottom duration-200 border border-gray-200 dark:border-gray-800">
        
        {/* Modal Handle bar (Mobile style) */}
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
              {title}
            </h3>
            <p className="text-[10px] text-gray-400 font-medium">
              Tersedia {options.length} pilihan • Ketik untuk mencari
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="relative flex items-center">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-9 py-2.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-gray-100 dark:divide-gray-800/60 max-h-[55vh]">
          {filteredOptions.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-gray-500 dark:text-gray-400">Tidak ada hasil ditemukan</p>
              <p className="text-[10px]">Coba kata kunci pencarian yang lain</p>
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = String(opt.value) === String(selectedValue);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-xl flex items-center justify-between transition-all my-0.5 active:scale-[0.99]",
                    isSelected
                      ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-extrabold border border-rose-200 dark:border-rose-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
                  )}
                >
                  <div className="flex flex-col pr-2">
                    <span className="text-xs tracking-tight">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] text-gray-400 font-normal mt-0.5">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 rounded-xl transition-all"
          >
            Batal
          </button>
        </div>

      </div>
    </div>
  );
}

interface SelectTriggerButtonProps {
  label: string;
  valueName?: string;
  placeholder?: string;
  onClick: () => void;
  required?: boolean;
}

export function SelectTriggerButton({
  label,
  valueName,
  placeholder = "-- Pilih --",
  onClick,
}: SelectTriggerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2.5 text-xs border rounded-xl flex items-center justify-between text-left transition-all shadow-xs cursor-pointer active:scale-[0.99]",
        valueName
          ? "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-bold"
          : "bg-gray-50 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-semibold"
      )}
    >
      <span className="truncate pr-2">{valueName || placeholder}</span>
      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
    </button>
  );
}
