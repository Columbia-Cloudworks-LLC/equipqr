import { format, formatInTimeZone } from 'date-fns-tz';
import { UserSettings } from '@/types/settings';

export const formatDateInUserSettings = (
  date: Date | string,
  settings: UserSettings,
  includeTime: boolean = false
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  let formatPattern: string = settings.dateFormat;
  
  if (includeTime) {
    const timePattern = settings.timeFormat === '12h' ? 'h:mm a' : 'HH:mm';
    formatPattern = `${formatPattern} ${timePattern}`;
  }
  
  try {
    return formatInTimeZone(dateObj, settings.timezone, formatPattern);
  } catch (error) {
    // Fallback to default formatting if timezone or format fails
    console.warn('Date formatting failed, using fallback:', error);
    return format(dateObj, formatPattern);
  }
};

export const formatTimeInUserSettings = (
  date: Date | string,
  settings: UserSettings
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timePattern = settings.timeFormat === '12h' ? 'h:mm a' : 'HH:mm';
  
  try {
    return formatInTimeZone(dateObj, settings.timezone, timePattern);
  } catch (error) {
    console.warn('Time formatting failed, using fallback:', error);
    return format(dateObj, timePattern);
  }
};

export const formatRelativeDate = (
  date: Date | string,
  settings: UserSettings
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return formatTimeInUserSettings(dateObj, settings);
  } else if (diffInHours < 24 * 7) {
    // Within a week, show day and time
    const dayPattern = settings.timeFormat === '12h' ? 'EEE h:mm a' : 'EEE HH:mm';
    try {
      return formatInTimeZone(dateObj, settings.timezone, dayPattern);
    } catch (error) {
      return format(dateObj, dayPattern);
    }
  } else {
    // More than a week, show full date
    return formatDateInUserSettings(dateObj, settings);
  }
};