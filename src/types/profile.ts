
import { DateTimeFormat } from "./supabase-enums";

export interface ProfileFormValues {
  email?: string | null;
  display_name: string;
  job_title: string;
  timezone: string;
  datetime_format_preference: DateTimeFormat;
  phone_number: string;
}
