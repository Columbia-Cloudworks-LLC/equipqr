import { useQuery } from '@tanstack/react-query';
import { getWorkOrderImageCount } from '@/services/deleteWorkOrderService';
import { queryKeys } from '@/lib/queryKeys';

export const useWorkOrderImageCount = (workOrderId: string) => {
  return useQuery({
    queryKey: queryKeys.workOrders.imageCount(workOrderId),
    queryFn: () => getWorkOrderImageCount(workOrderId),
    enabled: !!workOrderId,
  });
};