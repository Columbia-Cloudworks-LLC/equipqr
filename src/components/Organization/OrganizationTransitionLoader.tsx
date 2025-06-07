
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Loader2 } from 'lucide-react';

interface OrganizationTransitionLoaderProps {
  message?: string;
  showCard?: boolean;
}

export function OrganizationTransitionLoader({ 
  message = "Switching organizations...", 
  showCard = true 
}: OrganizationTransitionLoaderProps) {
  const content = (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="relative">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <Loader2 className="h-4 w-4 absolute -top-1 -right-1 animate-spin text-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );

  if (showCard) {
    return (
      <Card>
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

export function OrganizationTransitionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
