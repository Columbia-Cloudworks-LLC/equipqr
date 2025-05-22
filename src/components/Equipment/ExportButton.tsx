
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Equipment } from "@/types";
import { generateEquipmentCsv, downloadCsv } from "@/utils/csvUtils";
import { Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExportButtonProps {
  equipment: Equipment[];
  isLoading?: boolean;
}

export function ExportButton({ equipment, isLoading = false }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  
  const handleExport = () => {
    // Don't allow export if already in progress or if main data is still loading
    if (exporting || isLoading) return;
    
    setExporting(true);
    
    try {
      // Generate CSV content from equipment data
      const csvContent = generateEquipmentCsv(equipment);
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
      const filename = `equipment-export-${timestamp}.csv`;
      
      // Download the CSV file
      downloadCsv(csvContent, filename);
      
      console.log(`Exported ${equipment.length} equipment records to CSV`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            disabled={isLoading || exporting || equipment.length === 0}
            className="ml-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exporting..." : "Export to CSV"}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Export {equipment.length} equipment items to CSV file</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
