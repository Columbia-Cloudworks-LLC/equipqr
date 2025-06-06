
import { supabase } from '@/integrations/supabase/client';

export async function setupBillingExemptions() {
  console.log('Setting up billing exemptions...');

  try {
    // Set up partial exemption for 3-A Equipment (5 free users)
    console.log('Setting up partial exemption for 3-A Equipment...');
    const { data: data1, error: error1 } = await supabase.functions.invoke('setup-billing-exemption', {
      body: {
        email: 'info@3aequipment.com', // Updated to a more professional email
        exemption_type: 'partial',
        free_user_count: 5,
        reason: 'Partnership exemption - First 5 users free for 3-A Equipment'
      }
    });

    if (error1) {
      console.error('Error setting up 3-A Equipment exemption:', error1);
      throw error1;
    }

    console.log('3-A Equipment exemption set up successfully:', data1);

    // Set up full exemption for Columbia Cloudworks
    console.log('Setting up full exemption for Columbia Cloudworks...');
    const { data: data2, error: error2 } = await supabase.functions.invoke('setup-billing-exemption', {
      body: {
        email: 'admin@columbiacloudworks.com', // Updated to a more professional email
        exemption_type: 'full',
        reason: 'Strategic partnership - Full billing exemption for Columbia Cloudworks'
      }
    });

    if (error2) {
      console.error('Error setting up Columbia Cloudworks exemption:', error2);
      throw error2;
    }

    console.log('Columbia Cloudworks exemption set up successfully:', data2);

    return {
      success: true,
      message: 'Both billing exemptions have been set up successfully',
      exemptions: {
        '3aEquipment': data1,
        'columbiaCloudworks': data2
      }
    };

  } catch (error) {
    console.error('Failed to set up billing exemptions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
