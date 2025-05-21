import { Farmer, BankDetails, FarmerDocuments, Field, User } from '@chaya/shared';

export interface FarmerWithRelations extends Farmer {
  bankDetails?: BankDetails | null;
  documents?: FarmerDocuments | null;
  fields?: Field[];
  createdBy?: Pick<User, 'name'>;
}
