
import { diagnoseEquipmentService } from '@/services/equipment/equipmentListService';

export function useDiagnostics() {
  // Function to run diagnostics when we get errors
  const runDiagnostics = () => {
    diagnoseEquipmentService().then(result => {
      console.info('Equipment service diagnostics:', result);
    }).catch(e => {
      console.error('Diagnostics failed:', e);
    });
  };

  return { runDiagnostics };
}
