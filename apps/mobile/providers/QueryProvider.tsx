import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/query';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
