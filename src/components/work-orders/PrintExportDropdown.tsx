import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Printer, Download, FileText, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PrintExportDropdownProps {
  onPrint: () => void;
  onDownloadPDF: () => void;
  onPrintBrowser: () => void;
  disabled?: boolean;
}

const PrintExportDropdown: React.FC<PrintExportDropdownProps> = ({
  onPrint,
  onDownloadPDF,
  onPrintBrowser,
  disabled = false
}) => {
  const isMobile = useIsMobile();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          {isMobile ? (
            <Printer className="h-4 w-4" />
          ) : (
            <>
              <Printer className="h-4 w-4" />
              <span>Print</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onPrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          <span>Print PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDownloadPDF} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span>Download PDF</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onPrintBrowser} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>Browser Print</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PrintExportDropdown;