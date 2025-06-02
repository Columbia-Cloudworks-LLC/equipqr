
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Upload, ChevronDown, Download, FileText, HelpCircle } from 'lucide-react';
import { EquipmentImportDialog } from './EquipmentImportDialog';
import { generateSampleCSV } from '@/services/equipment/equipmentImportService';
import { downloadFile } from '@/utils/csvUtils';
import { ImportResult } from '@/services/equipment/equipmentImportService';

interface EquipmentImportButtonProps {
  onImportComplete?: (result: ImportResult) => void;
}

export function EquipmentImportButton({ onImportComplete }: EquipmentImportButtonProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleDownloadSample = () => {
    try {
      const sampleData = generateSampleCSV();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
      downloadFile(sampleData, `equipment-sample-${timestamp}.csv`, 'text/csv');
      console.log('Sample CSV downloaded');
    } catch (error) {
      console.error('Error generating sample CSV:', error);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      // Generate empty template with just headers
      const headers = [
        'name',
        'manufacturer', 
        'model',
        'serial_number',
        'status',
        'location',
        'install_date',
        'warranty_expiration',
        'notes'
      ];
      
      const templateData = headers.join(',') + '\n';
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
      downloadFile(templateData, `equipment-template-${timestamp}.csv`, 'text/csv');
      console.log('Template CSV downloaded');
    } catch (error) {
      console.error('Error generating template CSV:', error);
    }
  };

  return (
    <>
      <div className="flex items-center">
        {/* Main import button */}
        <Button 
          onClick={() => setImportDialogOpen(true)}
          className="rounded-r-none border-r-0"
        >
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
        
        {/* Dropdown for sample downloads */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="default" 
              className="rounded-l-none px-2 border-l border-primary-foreground/20"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Sample Data</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleDownloadTemplate}>
              <FileText className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Download Template</span>
                <span className="text-xs text-muted-foreground">Empty CSV with headers</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleDownloadSample}>
              <Download className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Download Sample Data</span>
                <span className="text-xs text-muted-foreground">CSV with example equipment</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild>
              <div className="flex items-start space-x-2 p-2">
                <HelpCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="space-y-1">
                  <div className="text-xs font-medium">Supported Columns</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    name*, manufacturer, model, serial_number, status, location, install_date, warranty_expiration, notes
                  </div>
                  <div className="text-xs text-muted-foreground">
                    * Required field
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EquipmentImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={onImportComplete}
      />
    </>
  );
}
