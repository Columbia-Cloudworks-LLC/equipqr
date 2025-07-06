// Validation utilities for the invitation system after RLS policy fixes
import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Validates that the invitation system is working correctly with the new RLS policies
 */
export const validateInvitationSystem = async (): Promise<ValidationResult[]> => {
  const results: ValidationResult[] = [];

  try {
    // Test 1: Check if user can fetch their own organization memberships
    console.log('🧪 Testing organization membership access...');
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role, status');

    results.push({
      success: !membershipError,
      message: 'Organization membership access',
      details: { count: memberships?.length || 0, error: membershipError?.message }
    });

    if (memberships && memberships.length > 0) {
      const orgId = memberships[0].organization_id;

      // Test 2: Check if invitation security functions work
      console.log('🧪 Testing invitation security functions...');
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData.user) {
        const { data: isAdmin, error: adminError } = await supabase.rpc('check_admin_permission_safe', {
          user_uuid: userData.user.id,
          org_id: orgId
        });

        results.push({
          success: !adminError,
          message: 'Admin permission check function',
          details: { isAdmin, error: adminError?.message }
        });

        // Test 3: Check if invitation fetching works with new function
        console.log('🧪 Testing invitation fetching...');
        const { data: invitations, error: invitationError } = await supabase.rpc('get_user_invitations_safe', {
          user_uuid: userData.user.id,
          org_id: orgId
        });

        results.push({
          success: !invitationError,
          message: 'Invitation fetching with security function',
          details: { count: invitations?.length || 0, error: invitationError?.message }
        });
      }
    }

    // Test 4: Check if session loading works without infinite recursion
    console.log('🧪 Testing session loading...');
    const sessionStart = performance.now();
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, plan');
    
    const sessionTime = performance.now() - sessionStart;
    
    results.push({
      success: !orgError && sessionTime < 5000, // Should complete within 5 seconds
      message: 'Organization loading performance',
      details: { time: `${sessionTime.toFixed(2)}ms`, count: orgs?.length || 0, error: orgError?.message }
    });

  } catch (error: any) {
    results.push({
      success: false,
      message: 'Validation system error',
      details: { error: error.message }
    });
  }

  return results;
};

/**
 * Logs validation results in a readable format
 */
export const logValidationResults = (results: ValidationResult[]) => {
  console.log('\n🔍 INVITATION SYSTEM VALIDATION RESULTS\n');
  
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.message}`);
    
    if (result.details) {
      console.log(`   Details:`, result.details);
    }
    console.log('');
  });

  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`📊 Summary: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Invitation system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the details above.');
  }
};

/**
 * Quick validation function for development use
 */
export const quickValidate = async () => {
  const results = await validateInvitationSystem();
  logValidationResults(results);
  return results.every(r => r.success);
};