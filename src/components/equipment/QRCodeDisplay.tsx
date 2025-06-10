
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  equipmentId: string;
  open: boolean;
  onClose: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ equipmentId, open, onClose }) => {
  // For now, we'll create a simple placeholder QR code
  // In the real implementation, we would use the qrcode.react library
  const qrValue = `https://equipqr.app/equipment/${equipmentId}`;

  const handleDownload = () => {
    // In real implementation, this would download the QR code as an image
    toast.success('QR code download started');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Equipment QR Code',
        text: 'Scan this QR code to view equipment details',
        url: qrValue,
      }).catch(() => {
        // Fallback to copy to clipboard
        handleCopy();
      });
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrValue).then(() => {
      toast.success('QR code URL copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy URL');
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Equipment QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to quickly access equipment details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Placeholder */}
          <div className="flex justify-center">
            <div className="w-64 h-64 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg mx-auto flex items-center justify-center">
                  <div className="grid grid-cols-8 gap-1 w-24 h-24">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 ${Math.random() > 0.5 ? 'bg-white' : 'bg-gray-800'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">QR Code Placeholder</p>
              </div>
            </div>
          </div>

          {/* Equipment URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Equipment URL:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrValue}
                readOnly
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
              />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handleShare} className="flex-1">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDisplay;
