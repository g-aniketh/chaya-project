import type { Procurement, Farmer } from '@chaya/shared';

export interface ProcurementWithRelations extends Procurement {
  farmer: Pick<Farmer, 'name' | 'village' | 'panchayath' | 'mandal'>;
}
