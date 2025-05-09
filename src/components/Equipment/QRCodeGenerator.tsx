
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QRCodeGeneratorProps {
  value: string;
  equipmentName: string;
  className?: string;
}

const QRCodeGenerator = ({ value, equipmentName, className }: QRCodeGeneratorProps) => {
  const [size, setSize] = useState(128);
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      const qrCodeSvg = document.getElementById('equipment-qrcode')?.innerHTML;
      
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${equipmentName}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
              }
              .container {
                text-align: center;
                border: 1px solid #ccc;
                padding: 20px;
                max-width: 300px;
              }
              h3 {
                margin-bottom: 10px;
              }
              .qr-container {
                padding: 10px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h3>${equipmentName}</h3>
              <div class="qr-container">
                ${qrCodeSvg}
              </div>
              <p>Scan to view details</p>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Print after rendering QR code
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };
  
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div id="equipment-qrcode">
        <QRCodeSVG
          value={value}
          size={size}
          level="H"
          includeMargin={true}
          imageSettings={{
            src: '',
            excavate: true,
            height: 24,
            width: 24,
          }}
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setSize(Math.min(size + 32, 256))}
          className="px-2"
        >
          Zoom In
        </Button>
        <Button
          variant="outline" 
          onClick={() => setSize(Math.max(size - 32, 96))} 
          className="px-2"
        >
          Zoom Out
        </Button>
        <Button onClick={handlePrint} variant="default">
          Print QR Code
        </Button>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
