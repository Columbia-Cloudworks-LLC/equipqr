
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { ImageUploadService, ImageUploadResult } from '@/services/images/imageUploadService';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageUploadProps {
  onImagesUploaded: (imageUrls: string[]) => void;
  isUploading?: boolean;
  maxImages?: number;
}

export function ImageUpload({ 
  onImagesUploaded, 
  isUploading = false,
  maxImages = 5 
}: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + selectedFiles.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 50MB)`);
        return false;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    try {
      // Set upload progress for each file
      const progressMap: { [key: string]: boolean } = {};
      selectedFiles.forEach(file => {
        progressMap[file.name] = true;
      });
      setUploadProgress(progressMap);

      const results = await ImageUploadService.uploadImages(selectedFiles);
      
      // Check for any upload errors
      const errors = results.filter(result => result.error);
      const successfulUploads = results.filter(result => !result.error);

      if (errors.length > 0) {
        errors.forEach(error => {
          toast.error(`Failed to upload ${error.fileName}: ${error.error}`);
        });
      }

      if (successfulUploads.length > 0) {
        const imageUrls = successfulUploads.map(result => result.url);
        onImagesUploaded(imageUrls);
        setSelectedFiles([]);
        toast.success(`Successfully uploaded ${successfulUploads.length} image(s)`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadProgress({});
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="image-upload" className="text-sm font-medium">
              Attach Images (Optional)
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Upload up to {maxImages} images (max 50MB each). Supported: JPEG, PNG, GIF, WebP
            </p>
          </div>

          <Input
            ref={fileInputRef}
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            onClick={triggerFileInput}
            disabled={isUploading || selectedFiles.length >= maxImages}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Select Images
          </Button>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selected Images:</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-48">{file.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </Badge>
                    </div>
                    {uploadProgress[file.name] ? (
                      <div className="text-xs text-muted-foreground">Uploading...</div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <Button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || Object.keys(uploadProgress).length > 0}
                className="w-full"
              >
                {Object.keys(uploadProgress).length > 0 ? (
                  <>Uploading {Object.keys(uploadProgress).length} image(s)...</>
                ) : (
                  <>Upload {selectedFiles.length} image(s)</>
                )}
              </Button>
            </div>
          )}

          {selectedFiles.length >= maxImages && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Maximum of {maxImages} images can be uploaded per note.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
