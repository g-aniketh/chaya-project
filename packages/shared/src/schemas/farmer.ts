import { z } from 'zod';

export const farmerSchema = z.object({
  id: z.number().optional(),
  surveyNumber: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  relationship: z.enum(['SELF', 'SPOUSE', 'CHILD', 'OTHER']),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  community: z.string().min(1, 'Community is required'),
  aadharNumber: z.string().min(12, 'Valid Aadhar number required').max(12),
  state: z.string().min(1, 'State is required'),
  district: z.string().min(1, 'District is required'),
  mandal: z.string().min(1, 'Mandal is required'),
  village: z.string().min(1, 'Village is required'),
  panchayath: z.string().min(1, 'Panchayath is required'),
  dateOfBirth: z.string().transform(str => new Date(str)),
  age: z.number().int().min(18, 'Farmer must be at least 18 years old'),
  contactNumber: z.string().min(10, 'Valid contact number required'),
  isActive: z.boolean().default(true),
});

export const bankDetailsSchema = z.object({
  ifscCode: z.string().min(1, 'IFSC code is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  branchName: z.string().min(1, 'Branch name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  address: z.string().min(1, 'Bank address is required'),
  bankCode: z.string().min(1, 'Bank code is required'),
});

export const farmerDocumentsSchema = z.object({
  profilePicUrl: z.string().url('Valid profile picture URL required'),
  aadharDocUrl: z.string().url('Valid Aadhar document URL required'),
  bankDocUrl: z.string().url('Valid bank document URL required'),
});

export const fieldSchema = z.object({
  areaHa: z.number().positive('Area must be a positive number'),
  yieldEstimate: z.number().positive('Yield estimate must be a positive number'),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number(),
    altitude: z.number().nullable(),
    altitudeAccuracy: z.number().nullable(),
    timestamp: z.number(),
  }),
  landDocumentUrl: z.string().url('Valid land document URL required'),
});

export const createFarmerSchema = z.object({
  farmer: farmerSchema,
  bankDetails: bankDetailsSchema,
  documents: farmerDocumentsSchema,
  fields: z.array(fieldSchema).optional(),
});

export const updateFarmerSchema = z.object({
  farmer: farmerSchema.partial(),
  bankDetails: bankDetailsSchema.partial().optional(),
  documents: farmerDocumentsSchema.partial().optional(),
  fields: z.array(fieldSchema.partial()).optional(),
});

export const farmerQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  isActive: z.preprocess(val => {
    if (typeof val === 'string') {
      if (val.toLowerCase() === 'true') return true;
      if (val.toLowerCase() === 'false') return false;
    }
    return val;
  }, z.boolean().optional().default(true)),
});

export type FarmerInput = z.infer<typeof farmerSchema>;
export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;
export type FarmerDocumentsInput = z.infer<typeof farmerDocumentsSchema>;
export type FieldInput = z.infer<typeof fieldSchema>;
export type CreateFarmerInput = z.infer<typeof createFarmerSchema>;
export type UpdateFarmerInput = z.infer<typeof updateFarmerSchema>;
export type FarmerQuery = z.infer<typeof farmerQuerySchema>;
