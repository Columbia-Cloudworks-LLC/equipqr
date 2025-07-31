/**
 * Helper utilities for testing QR code functionality
 * These functions help simulate and test the QR redirect flow
 */

export const QRTestHelper = {
  /**
   * Simulate scanning a QR code by navigating to the QR redirect URL
   */
  simulateQRScan: (equipmentId: string) => {
    console.log('🧪 Simulating QR scan for equipment:', equipmentId);
    window.location.href = `/qr/${equipmentId}`;
  },

  /**
   * Check if there's a pending redirect in session storage
   */
  checkPendingRedirect: () => {
    const pendingRedirect = sessionStorage.getItem('pendingRedirect');
    console.log('🔍 Pending redirect:', pendingRedirect);
    return pendingRedirect;
  },

  /**
   * Clear any pending redirects (useful for testing)
   */
  clearPendingRedirect: () => {
    sessionStorage.removeItem('pendingRedirect');
    console.log('🗑️ Cleared pending redirect');
  },

  /**
   * Set a test pending redirect (for testing auth flow)
   */
  setTestPendingRedirect: (equipmentId: string) => {
    const testRedirect = `/equipment/${equipmentId}?qr=true`;
    sessionStorage.setItem('pendingRedirect', testRedirect);
    console.log('🧪 Set test pending redirect:', testRedirect);
  },

  /**
   * Get current organization context for debugging
   */
  debugOrganizationContext: () => {
    const sessionData = localStorage.getItem('equipqr_session_data');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        console.log('🏢 Current session organizations:', parsed.organizations);
        console.log('🎯 Current organization ID:', parsed.currentOrganizationId);
        return parsed;
      } catch (error) {
        console.error('❌ Error parsing session data:', error);
      }
    }
    return null;
  }
};

// Make available globally for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).QRTestHelper = QRTestHelper;
}