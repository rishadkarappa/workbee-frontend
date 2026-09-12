import { useCallback, useEffect, useState } from "react";
import { WorkService, type MyWorksParams } from "@/services/work-service";
import { getErrorMessage } from "@/utils/error-helper";

interface MediaItem {
  url: string;
  publicId: string;
}

export interface WorkItem {
  id: string;
  userId: string;
  workTitle: string;
  workCategory: string;
  workType: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  time?: string;
  images?: MediaItem[];
  videos?: MediaItem[];
  voiceFile?: MediaItem | null;
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

export interface UserBucketCounts {
  all: number;
  active: number;
  completed: number;
  pending: number;
  cancelled: number;
}

const emptyCounts: UserBucketCounts = { all: 0, active: 0, completed: 0, pending: 0, cancelled: 0 };

export function useMyWorks(params: MyWorksParams) {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: params.page ?? 1,
    limit: params.limit ?? 6,
    total: 0,
    totalPages: 1,
  });
  const [counts, setCounts] = useState<UserBucketCounts>(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await WorkService.getMyWorks(params);
      if (res.data.success) {
        const data = res.data.data;
        setWorks(data.works || []);
        setPagination(data.pagination);
        setCounts(data.counts ?? emptyCounts);
      } else {
        setError("Error while fetching works data");
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

  return { works, setWorks, pagination, counts, loading, error, refetch: fetchWorks };
}