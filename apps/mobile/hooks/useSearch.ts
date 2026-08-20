import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/search.service';

export function useGlobalSearch(q: string) {
  const keyword = q.trim();

  return useQuery({
    queryKey: ['global-search', keyword],
    queryFn: () => searchService.searchGlobal(keyword),
    enabled: keyword.length > 0,
    staleTime: 1000 * 30, // 30 seconds cache
  });
}
