import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface SaveStatusProps {
  status: 'saving' | 'saved' | 'error' | 'offline';
  lastSaved?: Date;
  className?: string;
}

export const SaveStatus: React.FC<SaveStatusProps> = ({ status, lastSaved, className }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Clock,
          text: 'Saving...',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'saved':
        return {
          icon: CheckCircle,
          text: lastSaved ? `Saved ${formatTime(lastSaved)}` : 'Saved',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'offline':
        return {
          icon: WifiOff,
          text: 'Offline',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      default:
        return {
          icon: Wifi,
          text: 'Ready',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.text}
    </Badge>
  );
};