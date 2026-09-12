import { useCallback, useEffect, useState } from "react";
import { WorkService, type LiveWorksParams } from "@/services/work-service";
import { getErrorMessage } from "@/utils/error-helper";

export interface LiveWork {
  id: string;
  userId: string;
  workTitle: string;
  workCategory: string;
  workType: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  manualAddress?: string;
  landmark?: string;
  budget?: number;
  status?: string;
  progress?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LiveWorkBucketCounts {
  all: number;
  assigned: number;
  started: number;
  ongoing: number;
}

const emptyCounts: LiveWorkBucketCounts = { all: 0, assigned: 0, started: 0, ongoing: 0 };

export function useLiveWorks(params: LiveWorksParams) {
  const [works, setWorks] = useState<LiveWork[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: params.page ?? 1,
    limit: params.limit ?? 6,
    total: 0,
    totalPages: 1,
  });
  const [counts, setCounts] = useState<LiveWorkBucketCounts>(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await WorkService.getLiveWorks(params);
      if (res.data.success) {
        const data = res.data.data;
        setWorks(data.works || []);
        setPagination(data.pagination);
        setCounts(data.counts ?? emptyCounts);
      } else {
        setError("Failed to load live works");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.limit, params.bucket]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  return { works, pagination, counts, loading, error, refetch: fetchWorks };
}