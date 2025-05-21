import type {
  ProcessingBatch,
  Procurement,
  ProcessingStage,
  Drying,
  Sale,
  User,
  ProcessingStageStatus as PrismaProcessingStageStatus,
} from '@chaya/shared';

export type ExtendedProcessingStageStatus = PrismaProcessingStageStatus | 'SOLD_OUT' | 'NO_STAGES';

export interface ProcessingBatchWithSummary
  extends Omit<ProcessingBatch, 'processingStages' | 'procurements' | 'sales'> {
  latestStageSummary: {
    id: number;
    processingCount: number;
    status: ExtendedProcessingStageStatus;
    processMethod: string;
    dateOfProcessing: Date;
    doneBy: string;
    initialQuantity: number;
    quantityAfterProcess: number | null;
    lastDryingQuantity: number | null;
  } | null;
  totalQuantitySoldFromBatch: number;
  netAvailableQuantity: number;
}

export interface SaleSummaryForStage extends Pick<Sale, 'id' | 'quantitySold' | 'dateOfSale'> {}

export interface ProcessingStageWithDetails extends ProcessingStage {
  dryingEntries: Drying[];
  sales: SaleSummaryForStage[]; // Add sales here
}

export interface SaleWithStageInfo extends Sale {
  processingStage: Pick<ProcessingStage, 'processingCount'>;
}

export interface ProcessingBatchWithDetails extends ProcessingBatch {
  procurements: (Procurement & { farmer: Pick<User, 'name'> & { village?: string } })[];
  processingStages: ProcessingStageWithDetails[]; // Use the updated type here
  sales: SaleWithStageInfo[]; // Overall sales for the batch, with stage info
  createdBy: Pick<User, 'id' | 'name'>;
  totalQuantitySoldFromBatch: number;
  netAvailableQuantity: number; // Net available from the latest stage
  latestStageSummary: {
    id: number;
    processingCount: number;
    status: ExtendedProcessingStageStatus;
    processMethod: string;
    dateOfProcessing: Date;
    doneBy: string;
    initialQuantity: number;
    quantityAfterProcess: number | null;
    lastDryingQuantity: number | null;
  } | null;
}
