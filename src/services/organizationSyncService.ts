// Organization synchronization service - breaks circular dependencies
import { EventEmitter } from 'events';

interface OrganizationSyncEvent {
  type: 'switch' | 'update' | 'session_ready';
  organizationId: string;
  source: 'session' | 'organization' | 'user';
}

class OrganizationSyncServiceClass extends EventEmitter {
  private currentOrganizationId: string | null = null;
  private isSessionReady = false;

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