
export interface UserSettings {
  // Personalization & Display
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de';
  timezone: string;
  
  // Dates
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  
  // Numbers & Units
  unitSystem: 'metric' | 'imperial';
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
  numberFormat: 'US' | 'EU';
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  workOrderAlerts: boolean;
  maintenanceReminders: boolean;
  teamUpdates: boolean;
}

export const defaultUserSettings: UserSettings = {
  theme: 'system',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  unitSystem: 'metric',
  currency: 'USD',
  numberFormat: 'US',
  emailNotifications: true,
  pushNotifications: true,
  workOrderAlerts: true,
  maintenanceReminders: true,
  teamUpdates: false,
};
