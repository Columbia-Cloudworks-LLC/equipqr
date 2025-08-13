import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackgroundSyncService } from '../backgroundSync';

// Mock dependencies
const mockSupabase = {
  channel: vi.fn(),
  removeChannel: vi.fn(),
};

const mockCacheManager = {
  invalidateOrganizationData: vi.fn(),
  invalidateEquipmentRelated: vi.fn(),
  invalidateWorkOrderRelated: vi.fn(),
  invalidateTeamRelated: vi.fn(),
  invalidateOrganizationMemberRelated: vi.fn(),
  invalidateOrganizationSlotRelated: vi.fn(),
  invalidateOrganizationInvitationRelated: vi.fn(),
};

const mockPerformanceMonitor = {
  startTimer: vi.fn(() => vi.fn()),
  recordMetric: vi.fn(),
};

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('../cacheManager', () => ({
  cacheManager: mockCacheManager,
}));

vi.mock('@/utils/performanceMonitoring', () => ({
  performanceMonitor: mockPerformanceMonitor,
}));

vi.mock('@/utils/logger', () => ({
  logger: mockLogger,
}));

describe('BackgroundSyncService', () => {
  let service: BackgroundSyncService;
  let mockChannel: {
    on: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset singleton instance
    (BackgroundSyncService as any).instance = undefined;
    
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    };
    
    mockSupabase.channel.mockReturnValue(mockChannel);
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Mock window event listeners
    global.addEventListener = vi.fn();
    global.removeEventListener = vi.fn();
    global.setInterval = vi.fn() as any;
    global.clearInterval = vi.fn();

    service = BackgroundSyncService.getInstance();
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = BackgroundSyncService.getInstance();
      const instance2 = BackgroundSyncService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('network listeners', () => {
    it('should set up network event listeners on construction', () => {
      expect(global.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(global.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('organization subscription', () => {
    const organizationId = 'org-1';

    it('should create subscription with all required tables', () => {
      service.subscribeToOrganization(organizationId);

      expect(mockSupabase.channel).toHaveBeenCalledWith(`organization-${organizationId}`);
      expect(mockChannel.on).toHaveBeenCalledTimes(7); // 7 different table subscriptions
      expect(mockChannel.subscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should not create duplicate subscriptions', () => {
      service.subscribeToOrganization(organizationId);
      service.subscribeToOrganization(organizationId);

      expect(mockSupabase.channel).toHaveBeenCalledTimes(1);
    });

    it('should set up equipment table subscription', () => {
      service.subscribeToOrganization(organizationId);

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment',
          filter: `organization_id=eq.${organizationId}`
        },
        expect.any(Function)
      );
    });

    it('should set up work orders table subscription', () => {
      service.subscribeToOrganization(organizationId);

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_orders',
          filter: `organization_id=eq.${organizationId}`
        },
        expect.any(Function)
      );
    });

    it('should unsubscribe from organization', () => {
      service.subscribeToOrganization(organizationId);
      service.unsubscribeFromOrganization(organizationId);

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('payload handling', () => {
    const organizationId = 'org-1';

    beforeEach(() => {
      service.subscribeToOrganization(organizationId);
    });

    it('should handle equipment changes', () => {
      const payload = {
        eventType: 'UPDATE',
        new: { id: 'eq-1', name: 'Test Equipment' },
        old: { id: 'eq-1', name: 'Old Equipment' },
      };

      // Get the equipment change handler from the mock calls
      const equipmentHandler = mockChannel.on.mock.calls.find(
        call => call[1].table === 'equipment'
      )?.[2];

      expect(equipmentHandler).toBeDefined();
      equipmentHandler(payload);

      expect(mockCacheManager.invalidateEquipmentRelated).toHaveBeenCalledWith(
        organizationId,
        'eq-1'
      );
    });

    it('should handle equipment deletion', () => {
      const payload = {
        eventType: 'DELETE',
        old: { id: 'eq-1', name: 'Test Equipment' },
      };

      const equipmentHandler = mockChannel.on.mock.calls.find(
        call => call[1].table === 'equipment'
      )?.[2];

      equipmentHandler(payload);

      expect(mockCacheManager.invalidateOrganizationData).toHaveBeenCalledWith(organizationId);
    });

    it('should handle work order changes', () => {
      const payload = {
        eventType: 'INSERT',
        new: { id: 'wo-1', equipment_id: 'eq-1', title: 'Test Work Order' },
      };

      const workOrderHandler = mockChannel.on.mock.calls.find(
        call => call[1].table === 'work_orders'
      )?.[2];

      workOrderHandler(payload);

      expect(mockCacheManager.invalidateWorkOrderRelated).toHaveBeenCalledWith(
        organizationId,
        'wo-1',
        'eq-1'
      );
    });

    it('should handle team changes', () => {
      const payload = {
        eventType: 'UPDATE',
        new: { id: 'team-1', name: 'Test Team' },
      };

      const teamHandler = mockChannel.on.mock.calls.find(
        call => call[1].table === 'teams'
      )?.[2];

      teamHandler(payload);

      expect(mockCacheManager.invalidateTeamRelated).toHaveBeenCalledWith(
        organizationId,
        'team-1'
      );
    });

    it('should handle note changes', () => {
      const payload = {
        eventType: 'INSERT',
        new: { id: 'note-1', equipment_id: 'eq-1', content: 'Test note' },
      };

      const noteHandler = mockChannel.on.mock.calls.find(
        call => call[1].table === 'equipment_notes'
      )?.[2];

      noteHandler(payload);

      expect(mockCacheManager.invalidateEquipmentRelated).toHaveBeenCalledWith(
        organizationId,
        'eq-1'
      );
    });
  });

  describe('offline sync queue', () => {
    const organizationId = 'org-1';

    beforeEach(() => {
      service.subscribeToOrganization(organizationId);
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
    });

    it('should queue items when offline', () => {
      const payload = {
        eventType: 'UPDATE',
        new: { id: 'eq-1', name: 'Test Equipment' },
      };

      const equipmentHandler = mockChannel.on.mock.calls.find(
        call => call[1].table === 'equipment'
      )?.[2];

      equipmentHandler(payload);

      const syncStatus = service.getSyncStatus();
      expect(syncStatus.queuedItems).toBe(1);
    });

    it('should limit queue size', () => {
      const payload = {
        eventType: 'UPDATE',
        new: { id: 'eq-1', name: 'Test Equipment' },
      };

      const equipmentHandler = mockChannel.on.mock.calls.find(
        call => call[1].table === 'equipment'
      )?.[2];

      // Add more than 100 items to trigger queue limiting
      for (let i = 0; i < 110; i++) {
        equipmentHandler({ ...payload, new: { ...payload.new, id: `eq-${i}` } });
      }

      const syncStatus = service.getSyncStatus();
      expect(syncStatus.queuedItems).toBe(50); // Should be limited to last 50 items
    });
  });

  describe('periodic sync', () => {
    const organizationId = 'org-1';

    it('should start periodic sync', () => {
      service.startPeriodicSync(organizationId, 1000);

      expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it('should use default interval when none provided', () => {
      service.startPeriodicSync(organizationId);

      expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
    });
  });

  describe('reconnection handling', () => {
    it('should handle subscription status changes', () => {
      const organizationId = 'org-1';
      service.subscribeToOrganization(organizationId);

      // Get the subscription callback
      const subscriptionCallback = mockChannel.subscribe.mock.calls[0][0];

      // Test successful subscription
      subscriptionCallback('SUBSCRIBED');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('SUBSCRIBED')
      );

      // Test channel error
      subscriptionCallback('CHANNEL_ERROR');
      // Should trigger reconnection logic
    });
  });

  describe('sync status', () => {
    it('should return correct sync status', () => {
      const status = service.getSyncStatus();

      expect(status).toEqual({
        isOnline: expect.any(Boolean),
        activeSubscriptions: expect.any(Number),
        queuedItems: expect.any(Number),
        reconnectAttempts: expect.any(Number),
      });
    });
  });

  describe('cleanup', () => {
    it('should clean up all subscriptions and intervals', () => {
      const organizationId = 'org-1';
      
      service.subscribeToOrganization(organizationId);
      service.startPeriodicSync(organizationId);
      
      service.cleanup();

      expect(mockSupabase.removeChannel).toHaveBeenCalled();
      expect(global.clearInterval).toHaveBeenCalled();
    });
  });
});