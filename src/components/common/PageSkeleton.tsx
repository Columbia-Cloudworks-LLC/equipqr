import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface PageSkeletonProps {
  type?: 'grid' | 'list' | 'cards';
  count?: number;
  className?: string;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({ 
  type = "grid", 
  count = 3,
  className = ""
}) => {
  const skeletonTypes = {
    grid: () => (
      <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    ),
    list: () => (
      <div className={`space-y-4 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    ),
    cards: () => (
      <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                <div className="h-20 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  };
  
  return skeletonTypes[type]();
};

interface LoadingStateProps {
  title: string;
  description?: string;
  type?: 'grid' | 'list' | 'cards';
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title,
  description,
  type = "grid",
  count = 3
}) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
    <PageSkeleton type={type} count={count} />
  </div>
);