
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadWithNoteProps {
  onUpload: (files: File[]) => Promise<any>;
  maxFiles?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

const ImageUploadWithNote: React.FC<ImageUploadWithNoteProps> = ({
  onUpload,
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  disabled = false
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔍 File selection triggered');
    const files = Array.from(event.target.files || []);
    console.log('🔍 Selected files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    console.log('🔍 Adding files:', files.length);
    const validFiles = files.filter(file => {
      console.log('🔍 Validating file:', { name: file.name, type: file.type, size: file.size });
      
      if (!acceptedTypes.includes(file.type)) {
        console.error('❌ File type not accepted:', file.type);
        toast.error(`${file.name} is not a supported image format`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        console.error('❌ File too large:', file.size);
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      console.log('✅ File validated successfully:', file.name);
      return true;
    });

    console.log('🔍 Valid files count:', validFiles.length);

    setSelectedFiles(prev => {
      const combined = [...prev, ...validFiles];
      console.log('🔍 Combined files:', combined.length, 'max allowed:', maxFiles);
      
      if (combined.length > maxFiles) {
        console.error('❌ Too many files:', combined.length, 'max:', maxFiles);
        toast.error(`Maximum ${maxFiles} files allowed`);
        return prev;
      }
      
      console.log('✅ Files added to selection:', combined.map(f => f.name));
      return combined;
    });
  };

  const removeFile = (index: number) => {
    console.log('🔍 Removing file at index:', index);
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      console.log('🔍 Files after removal:', newFiles.map(f => f.name));
      return newFiles;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    console.log('🔍 Files dropped');
    const files = Array.from(e.dataTransfer.files);
    console.log('🔍 Dropped files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    addFiles(files);
  };

  const handleUpload = async () => {
    console.log('🚀 Upload initiated');
    console.log('🔍 Selected files for upload:', selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    if (selectedFiles.length === 0) {
      console.error('❌ No files selected for upload');
      toast.error('Please select at least one image');
      return;
    }

    if (!onUpload) {
      console.error('❌ No onUpload handler provided');
      toast.error('Upload handler not configured');
      return;
    }

    console.log('🔍 Starting upload process...');
    setIsUploading(true);
    
    try {
      console.log('🔍 Calling onUpload with files:', selectedFiles.length);
      const result = await onUpload(selectedFiles);
      console.log('✅ Upload successful, result:', result);
      
      setSelectedFiles([]);
      console.log('🔍 Cleared selected files');
      
      toast.success('Images uploaded successfully!');
    } catch (error) {
      console.error('❌ Upload failed with error:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
      
      toast.error(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Don't clear files on error so user can retry
      console.log('🔍 Keeping files for retry due to error');
    } finally {
      console.log('🔍 Upload process completed, setting isUploading to false');
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* File Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Drop images here or click button below</p>
            <p className="text-xs text-muted-foreground">
              Supports JPEG, PNG, GIF, WebP up to 10MB each
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => {
                console.log('🔍 Choose Files button clicked');
                document.getElementById('file-input')?.click();
              }}
              className="mt-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
          </div>
          <Input
            id="file-input"
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Images ({selectedFiles.length})</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {selectedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={() => console.log('🔍 Image preview loaded for:', file.name)}
                      onError={(e) => console.error('❌ Image preview failed for:', file.name, e)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      console.log('🔍 Remove button clicked for file:', file.name);
                      removeFile(index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
          <Button
            onClick={() => {
              console.log('🔍 Upload button clicked');
              handleUpload();
            }}
            disabled={disabled || isUploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageUploadWithNote;
