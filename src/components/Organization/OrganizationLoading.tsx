
import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function OrganizationLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 mb-6" />
      
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full max-w-md" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-1/4" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="border-b px-4 py-3 bg-muted/30">
              <Skeleton className="h-5 w-full max-w-xs" />
            </div>
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="px-4 py-4 border-b last:border-0 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
