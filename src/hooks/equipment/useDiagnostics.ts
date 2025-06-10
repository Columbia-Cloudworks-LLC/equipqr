
import { useCallback } from 'react';
import { validateUserAccess, testDatabaseAccess } from '@/services/equipment/utils/schemaValidator';
import { supabase } from '@/integrations/supabase/client';

// Define the diagnostic result type
interface DiagnosticResult {
  check_type: string;
  status: string;
  count: number;
  details: string;
}

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
      
      // Test 6: Run comprehensive system diagnostics using direct SQL
      try {
        // Use a direct query instead of the RPC function that might not be properly typed
        const { data: equipmentIssues, error: equipmentError } = await supabase
          .from('equipment')
          .select('id, created_by, org_id, status')
          .is('created_by', null)
          .limit(5);
        
        const { data: allEquipment, error: countError } = await supabase
          .from('equipment')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null);
        
        const diagnosticResults: DiagnosticResult[] = [
          {
            check_type: 'null_created_by',
            status: (equipmentIssues?.length || 0) === 0 ? 'PASS' : 'FAIL',
            count: equipmentIssues?.length || 0,
            details: 'Equipment records with NULL created_by values'
          }
        ];
        
        console.log('🔧 System Diagnostics:', {
          results: diagnosticResults,
          error: equipmentError?.message || countError?.message
        });
        
        // Check if any diagnostic failed
        const hasFailures = diagnosticResults.some((result) => result.status === 'FAIL');
        if (hasFailures) {
          console.warn('⚠️ System diagnostics found issues:', 
            diagnosticResults.filter((result) => result.status === 'FAIL')
          );
        } else {
          console.log('✅ All system diagnostics passed');
        }
        
      } catch (error) {
        console.log('🔧 System Diagnostics:', {
          available: false,
          error: 'Diagnostic queries failed'
        });
      }
      
      console.log('✅ Diagnostics complete');
      
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
    }
  }, []);

  return { runDiagnostics };
}
