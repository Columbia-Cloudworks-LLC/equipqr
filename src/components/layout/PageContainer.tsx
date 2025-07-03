import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'compact' | 'default' | 'loose';
}

export const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className = "", 
  spacing = "default" 
}) => {
  const spacingClasses = {
    compact: "space-y-4",
    default: "space-y-6", 
    loose: "space-y-8"
  };

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {children}
    </div>
  );
};

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'compact' | 'default' | 'loose';
}

export const Section: React.FC<SectionProps> = ({ 
  children, 
  className = "",
  spacing = "default" 
}) => {
  const spacingClasses = {
    compact: "space-y-4",
    default: "space-y-6", 
    loose: "space-y-8"
  };

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {children}
    </div>
  );
};