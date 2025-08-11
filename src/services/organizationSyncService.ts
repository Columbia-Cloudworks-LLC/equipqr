// Organization synchronization service - breaks circular dependencies

interface OrganizationSyncEvent {
  type: 'switch' | 'update' | 'session_ready';
  organizationId: string;
  source: 'session' | 'organization' | 'user';
}

type EventListener = (event: OrganizationSyncEvent | string) => void;

class OrganizationSyncServiceClass {
  private listeners: Map<string, EventListener[]> = new Map();
  private currentOrganizationId: string | null = null;
  private isSessionReady = false;

  public on(event: string, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  public off(event: string, listener: EventListener) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  public emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data || event));
    }
  }

  public setSessionReady(ready: boolean) {
    this.isSessionReady = ready;
    if (ready) {
      this.emit('session_ready');
    }
  }

  public switchOrganization(organizationId: string, source: 'session' | 'organization' | 'user') {
    if (this.currentOrganizationId === organizationId) {
      return; // No change needed
    }
    
    this.currentOrganizationId = organizationId;
    
    const event: OrganizationSyncEvent = {
      type: 'switch',
      organizationId,
      source
    };
    
    this.emit('organization_change', event);
  }

  public getCurrentOrganizationId(): string | null {
    return this.currentOrganizationId;
  }

  public isReady(): boolean {
    return this.isSessionReady;
  }
}

export const OrganizationSyncService = new OrganizationSyncServiceClass();