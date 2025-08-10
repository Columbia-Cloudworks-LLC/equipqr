
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { showErrorToast } from '@/utils/errorHandling';

interface SecurityTestResult {
  canFetchOrganizations: boolean;
  canFetchMembers: boolean;
  canFetchTeams: boolean;
  hasErrors: boolean;
  errors: string[];
  lastTestedAt: string;
}

export const useOrganizationSecurity = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<SecurityTestResult>({
    canFetchOrganizations: false,
    canFetchMembers: false,
    canFetchTeams: false,
    hasErrors: false,
    errors: [],
    lastTestedAt: ''
  });
  const [isTestingComplete, setIsTestingComplete] = useState(false);

  const runSecurityTest = useCallback(async () => {
    if (!user) {
      setTestResult({
        canFetchOrganizations: false,
        canFetchMembers: false,
        canFetchTeams: false,
        hasErrors: true,
        errors: ['User not authenticated'],
        lastTestedAt: new Date().toISOString()
      });
      setIsTestingComplete(true);
      return;
    }

    console.log('🔒 Starting security validation test...');
    const errors: string[] = [];
    let canFetchOrganizations = false;
    let canFetchMembers = false;
    let canFetchTeams = false;

    try {
      // Test 1: Organization access with new RLS policy
      console.log('🏢 Testing organization access...');
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(5);

      if (orgError) {
        console.error('❌ Organization access failed:', orgError);
        showErrorToast(orgError, 'Organization Security Test');
        errors.push(`Organization access: ${orgError.message}`);
      } else {
        console.log('✅ Organization access successful:', orgData?.length || 0, 'organizations found');
        canFetchOrganizations = true;
      }

      // Test 2: Organization members access
      console.log('👥 Testing organization members access...');
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('user_id, role, status')
        .eq('user_id', user.id)
        .limit(5);

      if (memberError) {
        console.error('❌ Member access failed:', memberError);
        errors.push(`Member access: ${memberError.message}`);
      } else {
        console.log('✅ Member access successful:', memberData?.length || 0, 'memberships found');
        canFetchMembers = true;
      }

      // Test 3: Teams access (if user has organization access)
      if (canFetchOrganizations && orgData && orgData.length > 0) {
        console.log('🔧 Testing teams access...');
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id, name, organization_id')
          .eq('organization_id', orgData[0].id)
          .limit(5);

        if (teamError) {
          console.error('❌ Teams access failed:', teamError);
          errors.push(`Teams access: ${teamError.message}`);
        } else {
          console.log('✅ Teams access successful:', teamData?.length || 0, 'teams found');
          canFetchTeams = true;
        }
      }

      // Test 4: Validate that the security functions are working
      console.log('🔍 Testing security functions...');
      try {
        if (orgData && orgData.length > 0) {
          const { data: roleData, error: roleError } = await supabase
            .rpc('get_user_org_role_direct', {
              user_uuid: user.id,
              org_id: orgData[0].id
            });

          if (roleError) {
            console.error('⚠️ Security function test failed:', roleError);
            errors.push(`Security function: ${roleError.message}`);
          } else {
            console.log('✅ Security function working:', roleData);
          }
        }
      } catch (funcError) {
        console.error('❌ Security function error:', funcError);
        errors.push(`Security function: ${funcError}`);
      }

    } catch (generalError) {
      console.error('💥 General security test error:', generalError);
      errors.push(`General error: ${generalError}`);
    }

    const result: SecurityTestResult = {
      canFetchOrganizations,
      canFetchMembers,
      canFetchTeams,
      hasErrors: errors.length > 0,
      errors,
      lastTestedAt: new Date().toISOString()
    };

    console.log('🎯 Security test completed:', result);
    setTestResult(result);
    setIsTestingComplete(true);
  }, [user]);

  // Run test automatically when component mounts and user is available
  useEffect(() => {
    if (user && !isTestingComplete) {
      console.log('🚀 Auto-starting security validation...');
      runSecurityTest();
    }
  }, [user, isTestingComplete, runSecurityTest]);

  return {
    testResult,
    isTestingComplete,
    runSecurityTest
  };
};
