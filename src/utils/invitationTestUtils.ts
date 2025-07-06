import { supabase } from '@/integrations/supabase/client';

export interface InvitationTestResult {
  success: boolean;
  duration: number;
  error?: string;
  testName: string;
}

/**
 * Test suite for invitation system performance and reliability
 */
export class InvitationTester {
  private results: InvitationTestResult[] = [];

  async runBasicInvitationTest(organizationId: string, testEmail: string): Promise<InvitationTestResult> {
    const startTime = performance.now();
    const testName = 'basic_invitation_creation';

    try {
      // Test basic invitation creation
      const { data, error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          email: testEmail,
          role: 'member',
          invited_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Clean up test invitation
      await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', data.id);

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
    const testName = 'permission_validation';

    try {
      // Test permission validation functions
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

  async runStressTest(organizationId: string, iterations: number = 5): Promise<InvitationTestResult[]> {
    const results: InvitationTestResult[] = [];
    const testEmails = Array.from({ length: iterations }, (_, i) => `test${i}@example.com`);

    for (let i = 0; i < iterations; i++) {
      try {
        const result = await this.runBasicInvitationTest(organizationId, testEmails[i]);
        results.push(result);
        
        // Add delay between tests to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Stress test iteration ${i} failed:`, error);
      }
    }

    return results;
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