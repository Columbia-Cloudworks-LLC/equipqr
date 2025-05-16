
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EquipmentDetailLoadingProps {
  onBackClick: () => void;
}

export function EquipmentDetailLoading({ onBackClick }: EquipmentDetailLoadingProps) {
  return (
    <div className="flex-1 p-4 sm:p-6 space-y-4">
      <div className="flex justify-start">
        <Button variant="ghost" onClick={onBackClick}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <div className="space-y-6">
        {/* Title skeleton */}
        <Skeleton className="h-8 w-2/3 sm:w-1/3" />
        
        {/* Tabs skeleton */}
        <div className="border-b">
          <Tabs defaultValue="skeleton" className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="skeleton" className="opacity-50">
                <Skeleton className="h-4 w-16" />
              </TabsTrigger>
              <TabsTrigger value="skeleton2" className="opacity-50">
                <Skeleton className="h-4 w-16" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-28 w-full" />
                <div className="flex justify-center">
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
