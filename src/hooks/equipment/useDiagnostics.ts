
import { useCallback } from 'react';
import { validateUserAccess, testDatabaseAccess } from '@/services/equipment/utils/schemaValidator';
import { supabase } from '@/integrations/supabase/client';

export function useDiagnostics() {
  const runDiagnostics = useCallback(async () => {
    console.log('🔍 Running equipment system diagnostics...');
    
    try {
      // Test 1: User access validation
      const userValidation = await validateUserAccess();
      console.log('👤 User Access:', userValidation);
      
      // Test 2: Database connectivity
      const dbAccess = await testDatabaseAccess();
      console.log('🗄️ Database Access:', dbAccess);
      
      // Test 3: Check if required functions exist by trying to call one
      try {
        const { data: functionTest, error: functionError } = await supabase.rpc('can_create_equipment_safe', {
          p_user_id: userValidation.userId || '',
          p_team_id: null
        });
        
        console.log('⚙️ Function Access:', { 
          available: !functionError,
          error: functionError?.message 
        });
      } catch (error) {
        console.log('⚙️ Function Access:', { 
          available: false,
          error: 'Function not accessible'
        });
      }
      
      // Test 4: Check user organizations
      if (userValidation.isValid && userValidation.userId) {
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userValidation.userId);
        
        console.log('🏢 User Organizations:', { 
          count: userRoles?.length || 0,
          roles: userRoles,
          error: rolesError?.message 
        });
      }
      
      // Test 5: Equipment table access
      const { data: equipmentCount, error: equipmentError } = await supabase
        .from('equipment')
        .select('id', { count: 'exact', head: true });
      
      console.log('📋 Equipment Access:', { 
        canAccess: !equipmentError,
        error: equipmentError?.message 
      });
      
      // Test 6: Run data integrity diagnostics using raw SQL call
      try {
        // Use a direct SQL call instead of rpc to avoid type issues
        const { data: integrityResults, error: integrityError } = await supabase
          .from('equipment')
          .select(`
            id,
            created_by,
            org_id,
            team_id,
            status
          `)
          .is('created_by', null)
          .limit(5);
        
        const nullCreatedByCount = integrityResults?.length || 0;
        
        console.log('🔧 Data Integrity Check:', {
          null_created_by_count: nullCreatedByCount,
          sample_records: integrityResults,
          error: integrityError?.message
        });
        
        // Additional check for invalid organization references
        const { data: invalidOrgCheck, error: invalidOrgError } = await supabase
          .from('equipment')
          .select(`
            id,
            org_id,
            organization:org_id(id, name)
          `)
          .is('organization.id', null)
          .limit(5);
        
        console.log('🔧 Invalid Org References:', {
          count: invalidOrgCheck?.length || 0,
          sample_records: invalidOrgCheck,
          error: invalidOrgError?.message
        });
        
      } catch (error) {
        console.log('🔧 Data Integrity Check:', {
          available: false,
          error: 'Direct integrity check failed'
        });
      }
      
      console.log('✅ Diagnostics complete');
      
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
    }
  }, []);

  return { runDiagnostics };
}
