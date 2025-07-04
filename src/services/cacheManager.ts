import { QueryClient } from '@tanstack/react-query';

// PHASE 3: Centralized cache invalidation and management
export class CacheManager {
  private static instance: CacheManager;
  private queryClient: QueryClient | null = null;
  private invalidationQueue: Set<string> = new Set();
  private syncInProgress = false;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  setQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  // Centralized cache invalidation patterns
  invalidateOrganizationData(organizationId: string) {
    if (!this.queryClient) return;
    
    const patterns = [
      ['teams-optimized', organizationId],
      ['work-orders-optimized', organizationId],
      ['equipment-optimized', organizationId],
      ['dashboard-optimized', organizationId],
      ['notes', organizationId],
      ['scans', organizationId]
    ];

    patterns.forEach(pattern => {
      this.queryClient!.invalidateQueries({ queryKey: pattern });
    });
  }

  // Smart invalidation based on data relationships
  invalidateEquipmentRelated(organizationId: string, equipmentId: string) {
    if (!this.queryClient) return;

    // Invalidate equipment data
    this.queryClient.invalidateQueries({ 
      queryKey: ['equipment-optimized', organizationId] 
    });
    
    // Invalidate work orders for this equipment
    this.queryClient.invalidateQueries({ 
      queryKey: ['work-orders', 'equipment', organizationId, equipmentId] 
    });
    
    // Invalidate equipment notes
    this.queryClient.invalidateQueries({ 
      queryKey: ['notes', organizationId, equipmentId] 
    });

    // Update dashboard stats
    this.queryClient.invalidateQueries({ 
      queryKey: ['dashboard-optimized', organizationId] 
    });
  }

  invalidateWorkOrderRelated(organizationId: string, workOrderId: string, equipmentId?: string) {
    if (!this.queryClient) return;

    // Invalidate work orders
    this.queryClient.invalidateQueries({ 
      queryKey: ['work-orders-optimized', organizationId] 
    });
    
    // If equipment is specified, invalidate equipment-related data
    if (equipmentId) {
      this.invalidateEquipmentRelated(organizationId, equipmentId);
    }

    // Update dashboard stats
    this.queryClient.invalidateQueries({ 
      queryKey: ['dashboard-optimized', organizationId] 
    });
  }

  invalidateTeamRelated(organizationId: string, teamId: string) {
    if (!this.queryClient) return;

    // Invalidate teams data
    this.queryClient.invalidateQueries({ 
      queryKey: ['teams-optimized', organizationId] 
    });
    
    // Invalidate work orders (team assignments might have changed)
    this.queryClient.invalidateQueries({ 
      queryKey: ['work-orders-optimized', organizationId] 
    });
  }

  // Batch invalidation to reduce re-renders
  batchInvalidate(organizationId: string, operations: Array<{
    type: 'equipment' | 'workOrder' | 'team' | 'organization';
    id?: string;
    equipmentId?: string;
  }>) {
    if (!this.queryClient) return;

    const uniqueInvalidations = new Set<string>();

    operations.forEach(op => {
      switch (op.type) {
        case 'equipment':
          if (op.id) {
            uniqueInvalidations.add(`equipment-${organizationId}-${op.id}`);
          }
          break;
        case 'workOrder':
          uniqueInvalidations.add(`work-orders-${organizationId}`);
          if (op.equipmentId) {
            uniqueInvalidations.add(`equipment-${organizationId}-${op.equipmentId}`);
          }
          break;
        case 'team':
          uniqueInvalidations.add(`teams-${organizationId}`);
          uniqueInvalidations.add(`work-orders-${organizationId}`);
          break;
        case 'organization':
          uniqueInvalidations.add(`dashboard-${organizationId}`);
          break;
      }
    });

    // Execute batch invalidation
    this.queryClient.invalidateQueries({ 
      predicate: (query) => {
        const keyStr = query.queryKey.join('-');
        return Array.from(uniqueInvalidations).some(pattern => keyStr.includes(pattern));
      }
    });
  }

  // Optimistic updates with rollback
  async optimisticUpdate<T>(
    queryKey: any[],
    updater: (old: T | undefined) => T,
    mutationFn: () => Promise<any>
  ): Promise<void> {
    if (!this.queryClient) return;

    // Cancel outgoing refetches
    await this.queryClient.cancelQueries({ queryKey });

    // Snapshot previous value
    const previousData = this.queryClient.getQueryData<T>(queryKey);

    // Optimistically update
    this.queryClient.setQueryData<T>(queryKey, updater);

    try {
      await mutationFn();
    } catch (error) {
      // Rollback on error
      this.queryClient.setQueryData(queryKey, previousData);
      throw error;
    }
  }

  // Preload related data
  preloadRelatedData(organizationId: string, type: 'equipment' | 'workOrder', id: string) {
    if (!this.queryClient) return;

    switch (type) {
      case 'equipment':
        // Preload work orders for this equipment
        this.queryClient.prefetchQuery({
          queryKey: ['work-orders', 'equipment', organizationId, id],
          staleTime: 2 * 60 * 1000
        });
        
        // Preload notes for this equipment
        this.queryClient.prefetchQuery({
          queryKey: ['notes', organizationId, id],
          staleTime: 5 * 60 * 1000
        });
        break;
      
      case 'workOrder':
        // Preload work order details
        this.queryClient.prefetchQuery({
          queryKey: ['work-order', organizationId, id],
          staleTime: 2 * 60 * 1000
        });
        break;
    }
  }

  // Get cache statistics
  getCacheStats() {
    if (!this.queryClient) return null;

    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      fetchingQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      errorQueries: queries.filter(q => q.state.status === 'error').length
    };
  }

  // Clear specific patterns
  clearCache(pattern?: string) {
    if (!this.queryClient) return;

    if (pattern) {
      this.queryClient.removeQueries({
        predicate: (query) => query.queryKey.some(key => 
          String(key).includes(pattern)
        )
      });
    } else {
      this.queryClient.clear();
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();