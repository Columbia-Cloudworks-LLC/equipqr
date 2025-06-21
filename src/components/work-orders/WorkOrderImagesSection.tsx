
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Upload, X, Download } from 'lucide-react';
import { useWorkOrderImages, useUploadWorkOrderImage } from '@/hooks/useWorkOrderData';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface WorkOrderImagesSectionProps {
  workOrderId: string;
  canUpload?: boolean;
}

const WorkOrderImagesSection: React.FC<WorkOrderImagesSectionProps> = ({
  workOrderId,
  canUpload = true
}) => {
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: images = [], isLoading } = useWorkOrderImages(workOrderId);
  const uploadImageMutation = useUploadWorkOrderImage();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      await uploadImageMutation.mutateAsync({
        workOrderId,
        file,
        description: description.trim() || undefined
      });
      
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Images & Attachments
          <Badge variant="outline">{images.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        {canUpload && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <Input
              placeholder="Optional description for the image..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              <span className="text-sm text-muted-foreground">
                Max 10MB, images only
              </span>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Images Grid */}
        <div className="space-y-4">
          {images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No images yet. Upload the first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((image) => (
                <div key={image.id} className="border rounded-lg overflow-hidden">
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={image.file_url}
                      alt={image.description || image.file_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center bg-muted">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm truncate">
                        {image.file_name}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={image.file_url}
                          download={image.file_name}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                    
                    {image.description && (
                      <p className="text-sm text-muted-foreground">
                        {image.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>By {image.uploaded_by_name}</span>
                      <span>{formatFileSize(image.file_size)}</span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(image.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkOrderImagesSection;
