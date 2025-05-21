'use client';

import { useState, useCallback } from 'react';
import { UploadDropzone } from '@/utils/uploadthing';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Check, Loader2, X, AlertCircle } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import imageCompression from 'browser-image-compression';

type UploadEndpoint = 'profilePicture' | 'aadharDocument' | 'bankDocument' | 'landDocument';

interface DocumentUploaderProps {
  endpoint: UploadEndpoint;
  value?: string;
  onChange: (url: string) => void;
  label: string;
  accept?: string;
}

const MAX_PDF_SIZE_KB = 200;
const MAX_IMAGE_SIZE_KB = 300;

export function DocumentUploader({ endpoint, value, onChange, label }: DocumentUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleRemove = () => {
    onChange('');
  };

  const compressFile = useCallback(async (file: File): Promise<File> => {
    const fileSizeKB = Math.round(file.size / 1024);

    if (file.type === 'application/pdf') {
      if (fileSizeKB > MAX_PDF_SIZE_KB) {
        throw new Error(
          `PDF file is too large (${fileSizeKB}KB). Please compress to under ${MAX_PDF_SIZE_KB}KB before uploading.`
        );
      }
      return file;
    }

    if (!file.type.startsWith('image/')) {
      return file;
    }

    setIsCompressing(true);

    try {
      const options = {
        maxSizeMB: MAX_IMAGE_SIZE_KB / 1024,
        maxWidthOrHeight: 1500,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const compressedSizeKB = Math.round(compressedFile.size / 1024);

      if (compressedSizeKB > MAX_IMAGE_SIZE_KB) {
        throw new Error(
          `Image could not be compressed enough (${compressedSizeKB}KB). Please use an image editor to reduce to under ${MAX_IMAGE_SIZE_KB}KB.`
        );
      }

      return compressedFile;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to compress image. Please try a smaller image (under ${MAX_IMAGE_SIZE_KB}KB).`);
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const validateAndProcessFiles = useCallback(
    async (files: File[]): Promise<File[]> => {
      try {
        const processedFiles = await Promise.all(
          files.map(async file => {
            try {
              return await compressFile(file);
            } catch (error) {
              if (error instanceof Error) {
                setError(error.message);
              } else {
                setError(`Unknown error processing file`);
              }
              throw error;
            }
          })
        );

        return processedFiles;
      } catch (error) {
        throw new Error('File processing failed');
      }
    },
    [compressFile]
  );

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>

      {value ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Document uploaded</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleRemove}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isUploading || isCompressing ? (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">
                {isCompressing ? 'Compressing file...' : 'Uploading document...'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Upload failed</p>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            <UploadDropzone
              endpoint={endpoint}
              onUploadBegin={() => {
                setIsUploading(true);
                setError(null);
              }}
              onClientUploadComplete={res => {
                setIsUploading(false);
                if (res && res[0]) {
                  onChange(res[0].url);
                }
              }}
              onUploadError={err => {
                setIsUploading(false);
                setError(err.message);
              }}
              onBeforeUploadBegin={validateAndProcessFiles}
              content={{
                label: `Upload ${label}`,
                allowedContent: `Images (${MAX_IMAGE_SIZE_KB}KB) or PDFs (${MAX_PDF_SIZE_KB}KB)`,
              }}
              config={{
                mode: 'auto',
              }}
            />

            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <p>• Images will be automatically compressed if possible</p>
              <p>• PDFs must be under {MAX_PDF_SIZE_KB}KB (typically 1 page)</p>
              <p>• For best results, ensure documents are clearly legible</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
