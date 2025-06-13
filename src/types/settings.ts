
export interface UserSettings {
  // Personalization
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  
  // Notifications
  emailNotifications: {
    workOrderUpdates: boolean;
    equipmentAlerts: boolean;
    teamAssignments: boolean;
    systemUpdates: boolean;
  };
  pushNotifications: {
    workOrderUpdates: boolean;
    equipmentAlerts: boolean;
    teamAssignments: boolean;
  };
  
  // Units & Measurements
  temperatureUnit: 'celsius' | 'fahrenheit';
  distanceUnit: 'metric' | 'imperial';
  
  // Date & Time
  timeFormat: '12h' | '24h';
  weekStartsOn: 'sunday' | 'monday';
  
  // Privacy & Security
  profileVisibility: 'public' | 'team' | 'private';
  dataSharing: boolean;
  analyticsOptOut: boolean;
}

export const defaultUserSettings: UserSettings = {
  theme: 'system',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  emailNotifications: {
    workOrderUpdates: true,
    equipmentAlerts: true,
    teamAssignments: true,
    systemUpdates: false,
  },
  pushNotifications: {
    workOrderUpdates: true,
    equipmentAlerts: true,
    teamAssignments: true,
  },
  temperatureUnit: 'fahrenheit',
  distanceUnit: 'imperial',
  timeFormat: '12h',
  weekStartsOn: 'sunday',
  profileVisibility: 'team',
  dataSharing: true,
  analyticsOptOut: false,
};

// Available options for dropdowns
export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

export const timezoneOptions = [
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'Europe/London', label: 'GMT' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
];
