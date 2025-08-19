import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CSVSuccessStepProps {
  importProgress: {
    processed: number;
    total: number;
    isImporting: boolean;
    completed: boolean;
    errors: Array<{ row: number; reason: string }>;
  };
  organizationName: string;
  importId: string;
  onClose: () => void;
  onDownloadErrors: () => void;
}

export const CSVSuccessStep: React.FC<CSVSuccessStepProps> = ({
  importProgress,
  organizationName,
  importId,
  onClose,
  onDownloadErrors
}) => {
  const navigate = useNavigate();
  
  const createdCount = importProgress.processed - importProgress.errors.length;
  const errorCount = importProgress.errors.length;
  
  const handleViewImported = () => {
    // Navigate to equipment page with filter for this import
    navigate(`/equipment?importId=${importId}`);
    onClose();
  };

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="w-16 h-16 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-2">Import Completed!</h2>
        <p className="text-muted-foreground">
          Your equipment data has been successfully imported to {organizationName}.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{createdCount}</p>
              <p className="text-sm text-muted-foreground">Equipment Created/Merged</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{importProgress.total}</p>
              <p className="text-sm text-muted-foreground">Total Rows Processed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{errorCount}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {errorCount > 0 && (
        <div className="text-left">
          <p className="text-sm text-muted-foreground mb-2">
            {errorCount} rows could not be imported due to errors.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onDownloadErrors}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Error Report
          </Button>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Close
        </Button>
        <Button onClick={handleViewImported} className="flex-1">
          <Eye className="w-4 h-4 mr-2" />
          View Imported Equipment
        </Button>
      </div>
    </div>
  );
};