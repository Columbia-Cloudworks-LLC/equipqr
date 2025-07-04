import jsPDF from 'jspdf';
import { PMChecklistItem, PreventativeMaintenance } from '@/services/preventativeMaintenanceService';

export interface PDFGeneratorOptions {
  includeProgress?: boolean;
  includeNotes?: boolean;
  includeTimestamps?: boolean;
}

export class PMChecklistPDFGenerator {
  private doc: jsPDF;
  private yPosition: number = 20;
  private readonly lineHeight = 6;
  private readonly pageHeight = 280;
  private readonly margin = 20;

  constructor() {
    this.doc = new jsPDF();
  }

  private addText(text: string, x: number = this.margin, fontSize: number = 10, style: 'normal' | 'bold' = 'normal') {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', style);
    
    if (this.yPosition > this.pageHeight) {
      this.doc.addPage();
      this.yPosition = 20;
    }
    
    this.doc.text(text, x, this.yPosition);
    this.yPosition += this.lineHeight;
  }

  private addMultilineText(text: string, x: number = this.margin, maxWidth: number = 170, fontSize: number = 10) {
    this.doc.setFontSize(fontSize);
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    for (const line of lines) {
      if (this.yPosition > this.pageHeight) {
        this.doc.addPage();
        this.yPosition = 20;
      }
      this.doc.text(line, x, this.yPosition);
      this.yPosition += this.lineHeight;
    }
  }

  private addSeparator() {
    this.yPosition += 3;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.yPosition, 190, this.yPosition);
    this.yPosition += 6;
  }

  private getConditionText(condition: number | null | undefined): string {
    if (condition === null || condition === undefined) return 'Not Rated';
    switch (condition) {
      case 1: return 'OK';
      case 2: return 'Adjusted';
      case 3: return 'Recommend Repairs';
      case 4: return 'Requires Immediate Repairs';
      case 5: return 'Unsafe Condition Present';
      default: return 'Unknown';
    }
  }

  private getStatusText(status: string): string {
    return status.replace('_', ' ').toUpperCase();
  }

  generatePDF(pm: PreventativeMaintenance, checklist: PMChecklistItem[], options: PDFGeneratorOptions = {}): jsPDF {
    const {
      includeProgress = true,
      includeNotes = true,
      includeTimestamps = true
    } = options;

    // Header
    this.addText('PREVENTATIVE MAINTENANCE CHECKLIST', this.margin, 16, 'bold');
    this.yPosition += 3;
    
    // PM Information
    this.addText(`PM ID: ${pm.id}`, this.margin, 12, 'bold');
    this.addText(`Status: ${this.getStatusText(pm.status)}`, this.margin, 12);
    
    if (includeTimestamps) {
      this.addText(`Created: ${new Date(pm.created_at).toLocaleDateString()}`, this.margin, 10);
      if (pm.completed_at) {
        this.addText(`Completed: ${new Date(pm.completed_at).toLocaleDateString()}`, this.margin, 10);
      }
    }

    if (includeProgress) {
      const completedItems = checklist.filter(item => item.condition !== null && item.condition !== undefined);
      this.addText(`Progress: ${completedItems.length}/${checklist.length} items completed`, this.margin, 10);
    }

    this.addSeparator();

    // Group items by section
    const sections = Array.from(new Set(checklist.map(item => item.section)));

    sections.forEach(section => {
      this.addText(section.toUpperCase(), this.margin, 12, 'bold');
      this.yPosition += 2;

      const sectionItems = checklist.filter(item => item.section === section);
      
      sectionItems.forEach(item => {
        // Item title and status
        const titleText = `${item.title} ${item.required ? '(Required)' : '(Optional)'}`;
        this.addText(titleText, this.margin + 5, 10, 'bold');
        
        const conditionText = `Status: ${this.getConditionText(item.condition)}`;
        this.addText(conditionText, this.margin + 5, 9);

        // Description
        if (item.description) {
          this.addMultilineText(`Description: ${item.description}`, this.margin + 5, 160, 9);
        }

        // Notes
        if (includeNotes && item.notes) {
          this.addMultilineText(`Notes: ${item.notes}`, this.margin + 5, 160, 9);
        }

        this.yPosition += 2;
      });

      this.addSeparator();
    });

    // General Notes
    if (includeNotes && pm.notes) {
      this.addText('GENERAL NOTES', this.margin, 12, 'bold');
      this.addMultilineText(pm.notes, this.margin, 170, 10);
    }

    // Footer
    this.yPosition = this.pageHeight + 5;
    this.addText(`Generated on ${new Date().toLocaleString()}`, this.margin, 8);

    return this.doc;
  }

  static generateAndDownload(pm: PreventativeMaintenance, checklist: PMChecklistItem[], options?: PDFGeneratorOptions): void {
    const generator = new PMChecklistPDFGenerator();
    const pdf = generator.generatePDF(pm, checklist, options);
    const filename = `PM-Checklist-${pm.id}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  }

  static generateAndPrint(pm: PreventativeMaintenance, checklist: PMChecklistItem[], options?: PDFGeneratorOptions): void {
    const generator = new PMChecklistPDFGenerator();
    const pdf = generator.generatePDF(pm, checklist, options);
    
    // Create a blob URL and open in new window for printing
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        // Clean up the blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
    }
  }
}