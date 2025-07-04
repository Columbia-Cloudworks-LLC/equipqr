
export interface UserSettings {
  // Personalization
  timezone: string;
  dateFormat: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd' | 'MMM dd, yyyy';
  
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
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/dd/yyyy',
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
export const timezoneOptions = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Berlin', label: 'Germany Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];
