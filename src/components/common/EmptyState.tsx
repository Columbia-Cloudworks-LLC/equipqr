import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ActionProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  props?: any;
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  primaryAction?: ActionProps;
  secondaryAction?: ActionProps;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  primaryAction,
  secondaryAction 
}) => (
  <Card>
    <CardContent className="text-center py-12">
      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <div className="flex gap-2 justify-center">
        {secondaryAction && (
          <Button variant="outline" {...secondaryAction.props}>
            {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4 mr-2" />}
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button {...primaryAction.props}>
            {primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />}
            {primaryAction.label}
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);