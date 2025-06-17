
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SecurityTestResult {
  canFetchOrganizations: boolean;
  canFetchMembers: boolean;
  canFetchTeams: boolean;
  hasErrors: boolean;
  errors: string[];
}

export const useOrganizationSecurity = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<SecurityTestResult>({
    canFetchOrganizations: false,
    canFetchMembers: false,
    canFetchTeams: false,
    hasErrors: false,
    errors: []
  });
  const [isTestingComplete, setIsTestingComplete] = useState(false);

  const runSecurityTest = async () => {
    if (!user) {
      setTestResult(prev => ({
        ...prev,
        hasErrors: true,
        errors: ['User not authenticated']
      }));
      setIsTestingComplete(true);
      return;
    }

    const errors: string[] = [];
    let canFetchOrganizations = false;
    let canFetchMembers = false;
    let canFetchTeams = false;

    try {
      console.log('Testing organization security with user:', user.id);

      // Test 1: Can fetch organizations
      console.log('Testing organization access...');
      const { data: orgsData, error: orgsError } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          status,
          organizations (
            id,
            name,
            plan,
            member_count,
            max_members,
            features,
            billing_cycle,
            next_billing_date
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (orgsError) {
        console.error('Organization fetch error:', orgsError);
        errors.push(`Organization fetch failed: ${orgsError.message}`);
      } else {
        console.log('Organization fetch successful:', orgsData);
        canFetchOrganizations = true;
      }

      // Test 2: Can fetch organization members (if user has organizations)
      if (orgsData && orgsData.length > 0) {
        const orgId = orgsData[0].organization_id;
        console.log('Testing organization members access for org:', orgId);
        
        const { data: membersData, error: membersError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', orgId);

        if (membersError) {
          console.error('Members fetch error:', membersError);
          errors.push(`Members fetch failed: ${membersError.message}`);
        } else {
          console.log('Members fetch successful:', membersData);
          canFetchMembers = true;
        }

        // Test 3: Can fetch teams
        console.log('Testing teams access for org:', orgId);
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .eq('organization_id', orgId);

        if (teamsError) {
          console.error('Teams fetch error:', teamsError);
          errors.push(`Teams fetch failed: ${teamsError.message}`);
        } else {
          console.log('Teams fetch successful:', teamsData);
          canFetchTeams = true;
        }
      }

    } catch (error) {
      console.error('Security test failed:', error);
      errors.push(`Security test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setTestResult({
      canFetchOrganizations,
      canFetchMembers,
      canFetchTeams,
      hasErrors: errors.length > 0,
      errors
    });
    setIsTestingComplete(true);
  };

  useEffect(() => {
    if (user && !isTestingComplete) {
      runSecurityTest();
    }
  }, [user, isTestingComplete]);

  return {
    testResult,
    isTestingComplete,
    runSecurityTest
  };
};
