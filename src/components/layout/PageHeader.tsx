import React from 'react';
import { Button } from '@/components/ui/button';
import TopBar from './TopBar';

interface ActionProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  props?: any;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: string;
  primaryAction?: ActionProps;
  secondaryActions?: ActionProps[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  breadcrumb,
  primaryAction,
  secondaryActions = []
}) => (
  <div className="flex items-center justify-between">
    <div className="min-w-0 flex-1">
      {breadcrumb && <TopBar breadcrumb={breadcrumb} />}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
    {(primaryAction || secondaryActions.length > 0) && (
      <div className="flex items-center gap-2">
        {secondaryActions.map((action, index) => (
          <Button key={index} variant="outline" {...action.props}>
            {action.icon && <action.icon className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        ))}
        {primaryAction && (
          <Button {...primaryAction.props}>
            {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
            {primaryAction.label}
          </Button>
        )}
      </div>
    )}
  </div>
);