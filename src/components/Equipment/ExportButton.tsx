
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Equipment } from "@/types";
import { 
  generateQrPrintCsv, 
  generateFullDataCsv, 
  generateEquipmentJson, 
  generateEquipmentXml,
  downloadFile 
} from "@/utils/csvUtils";
import { Download, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
  equipment: Equipment[];
  isLoading?: boolean;
}

type ExportFormat = 'qr-csv' | 'full-csv' | 'json' | 'xml';

export function ExportButton({ equipment, isLoading = false }: ExportButtonProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  
  const handleExport = (format: ExportFormat) => {
    // Don't allow export if already in progress or if main data is still loading
    if (exporting || isLoading) return;
    
    setExporting(format);
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
      let content: string;
      let filename: string;
      let mimeType: string;
      
      switch (format) {
        case 'qr-csv':
          content = generateQrPrintCsv(equipment);
          filename = `equipment-qr-print-${timestamp}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'full-csv':
          content = generateFullDataCsv(equipment);
          filename = `equipment-full-data-${timestamp}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'json':
          content = generateEquipmentJson(equipment);
          filename = `equipment-export-${timestamp}.json`;
          mimeType = 'application/json';
          break;
          
        case 'xml':
          content = generateEquipmentXml(equipment);
          filename = `equipment-export-${timestamp}.xml`;
          mimeType = 'application/xml';
          break;
          
        default:
          throw new Error('Unknown export format');
      }
      
      // Download the file
      downloadFile(content, filename, mimeType);
      
      console.log(`Exported ${equipment.length} equipment records to ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting equipment data:', error);
    } finally {
      setExporting(null);
    }
  };
  
  const isDisabled = isLoading || !!exporting || equipment.length === 0;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={isDisabled}
                className="ml-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "Exporting..." : "Export"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Export Formats</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => handleExport('qr-csv')}
                disabled={isDisabled || exporting === 'qr-csv'}
                className="flex flex-col items-start space-y-1"
              >
                <div className="font-medium">QR Print Format (CSV)</div>
                <div className="text-xs text-muted-foreground">URL, Title, Description - For QR code printers</div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => handleExport('full-csv')}
                disabled={isDisabled || exporting === 'full-csv'}
                className="flex flex-col items-start space-y-1"
              >
                <div className="font-medium">Full Data Export (CSV)</div>
                <div className="text-xs text-muted-foreground">All standard table fields - Standard spreadsheet format</div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleExport('json')}
                disabled={isDisabled || exporting === 'json'}
                className="flex flex-col items-start space-y-1"
              >
                <div className="font-medium">Full Data Export (JSON)</div>
                <div className="text-xs text-muted-foreground">Complete data with custom attributes - Excel compatible</div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleExport('xml')}
                disabled={isDisabled || exporting === 'xml'}
                className="flex flex-col items-start space-y-1"
              >
                <div className="font-medium">Full Data Export (XML)</div>
                <div className="text-xs text-muted-foreground">Structured XML with custom attributes - Excel compatible</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Export {equipment.length} equipment items in various formats</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
