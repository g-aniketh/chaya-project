import { createUploadthing, type FileRouter } from 'uploadthing/next';
import imageCompression from 'browser-image-compression';

async function compressFile(file: File): Promise<File> {
  if (file.type.startsWith('image/')) {
    const options = {
      maxSizeMB: 0.15,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Error compressing image:', error);
      return file;
    }
  } else if (file.type === 'application/pdf') {
    if (file.size <= 150 * 1024) {
      return file;
    }

    console.warn('PDF compression not supported directly. PDF exceeds 150KB limit:', file.name);
    return file;
  }

  return file;
}

const f = createUploadthing({
  errorFormatter: err => {
    console.log('Error uploading file', err.message);
    console.log('- Above error caused this: ', err.cause);
    return {
      message: err.message,
    };
  },
});

export const ourFileRouter: FileRouter = {
  profilePicture: f({ image: { maxFileSize: '1024KB', maxFileCount: 1 } })
    .middleware(async ({ req, files }) => {
      console.log('Middleware running for profilePicture');
      return { timestamp: Date.now() };
    })
    .onUploadComplete(async ({ file }) => {
      console.log('Profile picture upload complete', file.ufsUrl);
      return { url: file.ufsUrl };
    }),

  aadharDocument: f({
    image: { maxFileSize: '1024KB', maxFileCount: 1 },
    pdf: { maxFileSize: '1024KB', maxFileCount: 1 },
  })
    .middleware(async () => {
      console.log('Middleware running for aadharDocument');
      return { timestamp: Date.now() };
    })
    .onUploadComplete(async ({ file }) => {
      console.log('Aadhar document upload complete', file.ufsUrl);
      return { url: file.ufsUrl };
    }),

  bankDocument: f({
    image: { maxFileSize: '1024KB', maxFileCount: 1 },
    pdf: { maxFileSize: '1024KB', maxFileCount: 1 },
  })
    .middleware(async () => {
      console.log('Middleware running for bankDocument');
      return { timestamp: Date.now() };
    })
    .onUploadComplete(async ({ file }) => {
      console.log('Bank document upload complete', file.ufsUrl);
      return { url: file.ufsUrl };
    }),

  landDocument: f({
    image: { maxFileSize: '1024KB', maxFileCount: 1 },
    pdf: { maxFileSize: '1024KB', maxFileCount: 1 },
  })
    .middleware(async () => {
      console.log('Middleware running for landDocument');
      return { timestamp: Date.now() };
    })
    .onUploadComplete(async ({ file }) => {
      console.log('Land document upload complete', file.ufsUrl);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
