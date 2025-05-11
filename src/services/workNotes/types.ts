
import { supabase } from '@/integrations/supabase/client';

export interface WorkNote {
  id?: string;
  equipment_id: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  note: string;
  is_public: boolean;
  hours_worked?: number | null;
  deleted_at?: string | null;
  creator?: {
    display_name?: string;
    email?: string;
  };
}
