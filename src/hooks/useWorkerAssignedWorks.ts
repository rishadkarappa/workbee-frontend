import { useCallback, useEffect, useState } from "react";
import { WorkService, type WorkerAssignedWorksParams } from "@/services/work-service";
import { getErrorMessage } from "@/utils/error-helper";

export interface Work {
  id: string;
  userId: string;
  workTitle: string;
  workCategory: string;
  workType: string;
  status?: string;
  progress?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  manualAddress?: string;
  createdAt?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BucketCounts {
  all: number;
  assigned: number;
  started: number;
  ongoing: number;
  completed: number;
}

const emptyCounts: BucketCounts = { all: 0, assigned: 0, started: 0, ongoing: 0, completed: 0 };

export function useWorkerAssignedWorks(params: WorkerAssignedWorksParams) {
  const [works, setWorks] = useState<Work[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: params.page ?? 1,
    limit: params.limit ?? 6,
    total: 0,
    totalPages: 1,
  });
  const [counts, setCounts] = useState<BucketCounts>(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await WorkService.getWorkerAssignedWorks(params);
      if (res.data.success) {
        const data = res.data.data;
        setWorks(data.works || []);
        setPagination(data.pagination);
        setCounts(data.counts ?? emptyCounts);
      } else {
        setError('Failed to load assigned works');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.limit, params.bucket, params.startDate, params.endDate]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  return { works, pagination, counts, loading, error, refetch: fetchWorks };
}