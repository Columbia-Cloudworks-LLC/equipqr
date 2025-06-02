
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, AlertCircle, CheckCircle, X, FileText } from 'lucide-react';
import { parseCSV, ValidationError } from '@/utils/csvParser';
import { importEquipmentFromCSV, ImportResult, ImportProgress } from '@/services/equipment/equipmentImportService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface EquipmentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: (result: ImportResult) => void;
}

type ImportStage = 'select' | 'preview' | 'importing' | 'complete';

export function EquipmentImportDialog({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: EquipmentImportDialogProps) {
  const { selectedOrganization } = useOrganization();
  const [stage, setStage] = useState<ImportStage>('select');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    // Parse the CSV file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseCSV(content);
        setCsvData(parsed);
        setStage('preview');
        setIsProcessing(false);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to parse CSV file');
        setIsProcessing(false);
      }
    };
    reader.readAsText(selectedFile);
  }, []);

  const handleImport = useCallback(async () => {
    if (!csvData || !selectedOrganization) return;

    setStage('importing');
    setImportProgress({ current: 0, total: csvData.rows.length, stage: 'validating', message: 'Starting import...' });

    try {
      const result = await importEquipmentFromCSV(
        csvData,
        selectedOrganization.id,
        setImportProgress
      );

      setImportResult(result);
      setStage('complete');

      if (result.success) {
        toast.success(`Successfully imported ${result.imported} equipment records`);
        onImportComplete?.(result);
      } else {
        toast.error('Import failed with validation errors');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed unexpectedly');
      setStage('preview');
    }
  }, [csvData, selectedOrganization, onImportComplete]);

  const handleClose = useCallback(() => {
    setStage('select');
    setFile(null);
    setCsvData(null);
    setImportProgress(null);
    setImportResult(null);
    setIsProcessing(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const renderFileSelection = () => (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Select CSV File</h3>
          <p className="text-sm text-muted-foreground">
            Choose a CSV file containing equipment data to import
          </p>
          <div className="pt-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-file-input"
              disabled={isProcessing}
            />
            <label htmlFor="csv-file-input">
              <Button variant="outline" disabled={isProcessing} asChild>
                <span>
                  <FileText className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Choose File'}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Make sure your CSV includes a header row with column names like: name, manufacturer, model, serial_number, status, location, install_date, warranty_expiration, notes
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Preview Import</h3>
          <p className="text-sm text-muted-foreground">
            {csvData?.totalRows} rows found in {file?.name}
          </p>
        </div>
        <Badge variant="outline">
          {csvData?.headers.length} columns
        </Badge>
      </div>

      <div className="border rounded-lg">
        <div className="p-3 border-b bg-muted/50">
          <h4 className="font-medium text-sm">Column Headers</h4>
        </div>
        <div className="p-3">
          <div className="flex flex-wrap gap-2">
            {csvData?.headers.map((header: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {header}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {csvData?.rows.length > 0 && (
        <div className="border rounded-lg">
          <div className="p-3 border-b bg-muted/50">
            <h4 className="font-medium text-sm">Sample Data (first 3 rows)</h4>
          </div>
          <ScrollArea className="h-32">
            <div className="p-3 space-y-2">
              {csvData.rows.slice(0, 3).map((row: any, index: number) => (
                <div key={index} className="text-xs font-mono bg-muted/30 p-2 rounded">
                  {Object.entries(row).map(([key, value]: [string, any]) => (
                    <div key={key} className="truncate">
                      <span className="text-muted-foreground">{key}:</span> {value}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button onClick={handleImport} className="flex-1">
          Import {csvData?.totalRows} Records
        </Button>
        <Button variant="outline" onClick={() => setStage('select')}>
          Back
        </Button>
      </div>
    </div>
  );

  const renderImporting = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium">Importing Equipment</h3>
        <p className="text-sm text-muted-foreground">
          {importProgress?.message}
        </p>
      </div>

      {importProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="capitalize">{importProgress.stage}</span>
            <span>{importProgress.current} / {importProgress.total}</span>
          </div>
          <Progress 
            value={(importProgress.current / importProgress.total) * 100} 
            className="h-2"
          />
        </div>
      )}
    </div>
  );

  const renderComplete = () => (
    <div className="space-y-4">
      <div className="text-center">
        {importResult?.success ? (
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
        ) : (
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-2" />
        )}
        <h3 className="text-lg font-medium">
          {importResult?.success ? 'Import Complete' : 'Import Failed'}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-3 border rounded-lg">
          <div className="text-2xl font-bold text-green-600">{importResult?.imported}</div>
          <div className="text-sm text-muted-foreground">Imported</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-2xl font-bold text-red-600">{importResult?.failed}</div>
          <div className="text-sm text-muted-foreground">Failed</div>
        </div>
      </div>

      {importResult?.errors && importResult.errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Errors</h4>
          <ScrollArea className="h-32 border rounded-lg">
            <div className="p-3 space-y-2">
              {importResult.errors.map((error: ValidationError, index: number) => (
                <div key={index} className="text-xs bg-red-50 border border-red-200 p-2 rounded">
                  <div className="font-medium">Row {error.row}: {error.field}</div>
                  <div className="text-red-600">{error.message}</div>
                  {error.value && <div className="text-muted-foreground">Value: {error.value}</div>}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <Button onClick={handleClose} className="w-full">
        Close
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Import Equipment</DialogTitle>
              <DialogDescription>
                Import equipment data from a CSV file
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-[300px]">
          {stage === 'select' && renderFileSelection()}
          {stage === 'preview' && renderPreview()}
          {stage === 'importing' && renderImporting()}
          {stage === 'complete' && renderComplete()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
