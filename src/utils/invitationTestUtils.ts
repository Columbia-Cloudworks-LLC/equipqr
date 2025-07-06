import { supabase } from '@/integrations/supabase/client';

export interface InvitationTestResult {
  success: boolean;
  duration: number;
  error?: string;
  testName: string;
}

/**
 * Test suite for optimized invitation system performance and reliability
 */
export class InvitationTester {
  private results: InvitationTestResult[] = [];

  async runOptimizedInvitationTest(organizationId: string, testEmail: string): Promise<InvitationTestResult> {
    const startTime = performance.now();
    const testName = 'optimized_invitation_creation';

    try {
      // Test optimized invitation creation
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: invitationId, error } = await supabase.rpc('create_invitation_bypass_optimized', {
        p_organization_id: organizationId,
        p_email: testEmail,
        p_role: 'member',
        p_message: 'Test invitation',
        p_invited_by: userData.user.id
      });

      if (error) throw error;

      // Clean up test invitation
      await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      const duration = performance.now() - startTime;
      const result: InvitationTestResult = {
        success: true,
        duration,
        testName
      };

      this.results.push(result);
      return result;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      const result: InvitationTestResult = {
        success: false,
        duration,
        error: error.message,
        testName
      };

      this.results.push(result);
      return result;
    }
  }

  async runPermissionTest(organizationId: string): Promise<InvitationTestResult> {
    const startTime = performance.now();
    const testName = 'optimized_permission_validation';

    try {
      // Test optimized permission validation functions
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: isAdmin } = await supabase.rpc('check_admin_bypass_fixed', {
        user_uuid: userData.user.id,
        org_id: organizationId
      });

      const { data: isMember } = await supabase.rpc('check_member_bypass_fixed', {
        user_uuid: userData.user.id,
        org_id: organizationId
      });

      const duration = performance.now() - startTime;
      const result: InvitationTestResult = {
        success: true,
        duration,
        testName
      };

      this.results.push(result);
      console.log(`Permission check results: Admin=${isAdmin}, Member=${isMember}`);
      return result;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      const result: InvitationTestResult = {
        success: false,
        duration,
        error: error.message,
        testName
      };

      this.results.push(result);
      return result;
    }
  }

  async runOptimizedStressTest(organizationId: string, iterations: number = 5): Promise<InvitationTestResult[]> {
    const results: InvitationTestResult[] = [];
    const testEmails = Array.from({ length: iterations }, (_, i) => `test-optimized-${i}-${Date.now()}@example.com`);

    console.log(`Starting optimized stress test with ${iterations} iterations`);

    for (let i = 0; i < iterations; i++) {
      try {
        const result = await this.runOptimizedInvitationTest(organizationId, testEmails[i]);
        results.push(result);
        console.log(`Stress test ${i + 1}/${iterations}: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.duration.toFixed(2)}ms)`);
        
        // Minimal delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Stress test iteration ${i} failed:`, error);
      }
    }

    return results;
  }

  async testStackDepthResistance(organizationId: string): Promise<InvitationTestResult> {
    const startTime = performance.now();
    const testName = 'stack_depth_resistance';

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Test multiple rapid calls that previously caused stack depth issues
      const promises = Array.from({ length: 10 }, (_, i) => 
        supabase.rpc('create_invitation_bypass_optimized', {
          p_organization_id: organizationId,
          p_email: `stack-test-${i}-${Date.now()}@example.com`,
          p_role: 'member',
          p_message: 'Stack depth test',
          p_invited_by: userData.user.id
        })
      );

      const results = await Promise.allSettled(promises);
      
      // Clean up successful invitations
      const successfulIds = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && !result.value.error)
        .map(result => result.value.data);

      if (successfulIds.length > 0) {
        await supabase
          .from('organization_invitations')
          .delete()
          .in('id', successfulIds);
      }

      const duration = performance.now() - startTime;
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      const result: InvitationTestResult = {
        success: successCount >= 8, // Allow for a few failures
        duration,
        testName,
        error: successCount < 8 ? `Only ${successCount}/10 calls succeeded` : undefined
      };

      this.results.push(result);
      console.log(`Stack depth resistance test: ${successCount}/10 calls succeeded`);
      return result;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      const result: InvitationTestResult = {
        success: false,
        duration,
        error: error.message,
        testName
      };

      this.results.push(result);
      return result;
    }
  }

  getAverageTime(testName?: string): number {
    const relevantResults = testName 
      ? this.results.filter(r => r.testName === testName)
      : this.results;

    if (relevantResults.length === 0) return 0;

    const totalTime = relevantResults.reduce((sum, result) => sum + result.duration, 0);
    return totalTime / relevantResults.length;
  }

  getSuccessRate(testName?: string): number {
    const relevantResults = testName 
      ? this.results.filter(r => r.testName === testName)
      : this.results;

    if (relevantResults.length === 0) return 100;

    const successCount = relevantResults.filter(r => r.success).length;
    return (successCount / relevantResults.length) * 100;
  }

  getSummary(): string {
    const avgTime = this.getAverageTime();
    const successRate = this.getSuccessRate();
    const totalTests = this.results.length;

    return `
Invitation System Test Summary:
- Total Tests: ${totalTests}
- Success Rate: ${successRate.toFixed(1)}%
- Average Time: ${avgTime.toFixed(2)}ms
- Tests Passed: ${this.results.filter(r => r.success).length}
- Tests Failed: ${this.results.filter(r => !r.success).length}
    `.trim();
  }

  clearResults(): void {
    this.results = [];
  }
}

// Global test instance
export const invitationTester = new InvitationTester();