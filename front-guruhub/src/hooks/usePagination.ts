"use client";

import { useState } from "react";

export interface PaginationState {
  page: number;
  limit: number;
}

export function usePagination(initialPage: number = 1, initialLimit: number = 10) {
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);

  const setPagination = (newPage: number, newLimit?: number) => {
    setPage(newPage);
    if (newLimit) {
      setLimit(newLimit);
    }
  };

  const resetPagination = () => {
    setPage(1);
  };

  return {
    page,
    limit,
    setPage,
    setLimit,
    setPagination,
    resetPagination,
  };
}
