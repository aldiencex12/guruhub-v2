"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useFilters<T extends Record<string, any>>(initialFilters?: T) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getFilter = useCallback(
    (key: string, defaultValue: string = ""): string => {
      return searchParams.get(key) || (initialFilters && initialFilters[key]) || defaultValue;
    },
    [searchParams, initialFilters]
  );

  const setFilter = useCallback(
    (key: string, value: string | number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value !== null && value !== "" && value !== undefined) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
      // Reset page to 1 whenever filters change, unless setting page itself
      if (key !== "page") {
        params.set("page", "1");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const setMultipleFilters = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== null && value !== "" && value !== undefined) {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const resetFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  return {
    getFilter,
    setFilter,
    setMultipleFilters,
    resetFilters,
    searchParams,
  };
}
