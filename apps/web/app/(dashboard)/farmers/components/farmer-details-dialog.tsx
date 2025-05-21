'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { formatDate } from '../lib/utils';
import { ExternalLink } from 'lucide-react';
import { FarmerWithRelations } from '../lib/types';

interface FarmerDetailsDialogProps {
  farmer: FarmerWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FarmerDetailsDialog({ farmer, open, onOpenChange }: FarmerDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Farmer Details: {farmer.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="bank">Bank Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="Survey Number" value={farmer.surveyNumber} />
              <InfoItem label="Name" value={farmer.name} />
              <InfoItem label="Gender" value={farmer.gender} />
              <InfoItem label="Relationship" value={farmer.relationship} />
              <InfoItem label="Community" value={farmer.community} />
              <InfoItem label="Aadhar Number" value={farmer.aadharNumber} />
              <InfoItem label="Date of Birth" value={formatDate(farmer.dateOfBirth)} />
              <InfoItem label="Age" value={farmer.age.toString()} />
              <InfoItem label="Contact Number" value={farmer.contactNumber} />
              <InfoItem label="State" value={farmer.state} />
              <InfoItem label="District" value={farmer.district} />
              <InfoItem label="Mandal" value={farmer.mandal} />
              <InfoItem label="Village" value={farmer.village} />
              <InfoItem label="Panchayath" value={farmer.panchayath} />
            </div>
          </TabsContent>

          {/* Bank Details Tab */}
          <TabsContent value="bank" className="space-y-4">
            {farmer.bankDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Bank Name" value={farmer.bankDetails.bankName} />
                <InfoItem label="Branch Name" value={farmer.bankDetails.branchName} />
                <InfoItem label="IFSC Code" value={farmer.bankDetails.ifscCode} />
                <InfoItem label="Account Number" value={farmer.bankDetails.accountNumber} />
                <InfoItem label="Bank Code" value={farmer.bankDetails.bankCode} />
                <InfoItem label="Address" value={farmer.bankDetails.address} />
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No bank details available</p>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {farmer.documents ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentLink label="Profile Picture" url={farmer.documents.profilePicUrl} />
                <DocumentLink label="Aadhar Document" url={farmer.documents.aadharDocUrl} />
                <DocumentLink label="Bank Document" url={farmer.documents.bankDocUrl} />

                {farmer.fields && farmer.fields.length > 0 && (
                  <div className="col-span-2 mt-4">
                    <h3 className="text-lg font-medium mb-2">Field Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {farmer.fields.map((field, index) => (
                        <DocumentLink
                          key={field.id}
                          label={`Field ${index + 1} Document`}
                          url={field.landDocumentUrl}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No documents available</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for info items
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || 'N/A'}</p>
    </div>
  );
}

// Helper component for document links
function DocumentLink({ label, url }: { label: string; url: string }) {
  if (!url) return null;

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
      >
        View Document <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
