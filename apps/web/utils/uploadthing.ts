import { generateUploadButton, generateUploadDropzone, generateReactHelpers } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

// Explicit type annotations for each export
export const UploadButton: ReturnType<typeof generateUploadButton<OurFileRouter>> =
  generateUploadButton<OurFileRouter>();

export const UploadDropzone: ReturnType<typeof generateUploadDropzone<OurFileRouter>> =
  generateUploadDropzone<OurFileRouter>();

// Generate helpers, but do NOT export the object itself
const uploadHelpers: ReturnType<typeof generateReactHelpers<OurFileRouter>> = generateReactHelpers<OurFileRouter>();

export const useUploadThing: typeof uploadHelpers.useUploadThing = uploadHelpers.useUploadThing;
export const uploadFiles: typeof uploadHelpers.uploadFiles = uploadHelpers.uploadFiles;
