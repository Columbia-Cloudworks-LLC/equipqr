
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
      
      // Test 3: Check if required functions exist
      const { data: functions, error: functionsError } = await supabase.rpc('pg_get_functiondef', {
        funcid: 'check_equipment_create_permission'
      }).catch(() => ({ data: null, error: 'Function not accessible' }));
      
      console.log('⚙️ Function Access:', { 
        available: !functionsError,
        error: functionsError 
      });
      
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
      
      console.log('✅ Diagnostics complete');
      
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
    }
  }, []);

  return { runDiagnostics };
}
