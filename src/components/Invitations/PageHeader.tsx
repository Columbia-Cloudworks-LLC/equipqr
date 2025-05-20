
import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface PageHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export const PageHeader = ({ onRefresh, isLoading }: PageHeaderProps) => (
  <div className="flex justify-between items-center">
    <h1 className="text-2xl font-bold tracking-tight">My Invitations</h1>
    <Button 
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isLoading}
      className="flex items-center gap-1"
    >
      <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> 
      Reset & Refresh
    </Button>
  </div>
);
