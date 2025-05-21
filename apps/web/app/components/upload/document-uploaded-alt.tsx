// components/upload/document-uploader-alt.tsx
'use client';

import { useState } from 'react';
import { UploadButton } from '@/utils/uploadthing';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Check, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

type UploadEndpoint = 'profilePicture' | 'aadharDocument' | 'bankDocument' | 'landDocument';

interface DocumentUploaderAltProps {
  endpoint: UploadEndpoint;
  value?: string;
  onChange: (url: string) => void;
  label: string;
  accept?: string;
}

export function DocumentUploaderAlt({ endpoint, value, onChange, label, accept }: DocumentUploaderAltProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = () => {
    onChange('');
  };

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
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Upload className="h-5 w-5" />
              </div>

              <div className="space-y-1 text-center">
                <p className="text-sm font-medium">Upload {label}</p>
                <p className="text-xs text-muted-foreground">Max file size: 500KB</p>
              </div>

              <UploadButton
                endpoint={endpoint}
                onClientUploadComplete={res => {
                  if (res && res[0]) {
                    onChange(res[0].url);
                  }
                  setIsUploading(false);
                }}
                onUploadError={err => {
                  setError(err.message);
                  setIsUploading(false);
                }}
                onUploadBegin={() => {
                  setIsUploading(true);
                  setError(null);
                }}
                className="w-full"
                appearance={{
                  button: 'w-full bg-muted hover:bg-muted/80 text-foreground',
                  allowedContent: 'hidden',
                }}
              />

              {isUploading && (
                <div className="flex flex-col items-center gap-2 mt-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
