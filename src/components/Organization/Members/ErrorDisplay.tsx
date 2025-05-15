
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  refreshData: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, refreshData }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Organization Members</CardTitle>
          <Button variant="ghost" size="sm" onClick={refreshData}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-md">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorDisplay;
