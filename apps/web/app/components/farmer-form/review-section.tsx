// components/farmer-form/review-section.tsx
'use client';

import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { format } from 'date-fns';

export function ReviewSection() {
  const { watch } = useFormContext();
  const formValues = watch();
  const { farmer, bankDetails, documents, fields } = formValues;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd className="text-sm">{farmer.name || 'N/A'}</dd>
            </div>
            {/* <div>
							<dt className="text-sm font-medium text-muted-foreground">Survey Number</dt>
							<dd className="text-sm">{farmer.surveyNumber || 'N/A'}</dd>
						</div> */}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Relationship</dt>
              <dd className="text-sm">{farmer.relationship || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Gender</dt>
              <dd className="text-sm">{farmer.gender || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Community</dt>
              <dd className="text-sm">{farmer.community || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Aadhar Number</dt>
              <dd className="text-sm">{farmer.aadharNumber || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Date of Birth</dt>
              <dd className="text-sm">{farmer.dateOfBirth ? format(new Date(farmer.dateOfBirth), 'PPP') : 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Age</dt>
              <dd className="text-sm">{farmer.age || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Contact Number</dt>
              <dd className="text-sm">{farmer.contactNumber || 'N/A'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">State</dt>
              <dd className="text-sm">{farmer.state || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">District</dt>
              <dd className="text-sm">{farmer.district || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Mandal</dt>
              <dd className="text-sm">{farmer.mandal || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Village</dt>
              <dd className="text-sm">{farmer.village || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Panchayath</dt>
              <dd className="text-sm">{farmer.panchayath || 'N/A'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">IFSC Code</dt>
              <dd className="text-sm">{bankDetails?.ifscCode || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Bank Name</dt>
              <dd className="text-sm">{bankDetails?.bankName || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Branch Name</dt>
              <dd className="text-sm">{bankDetails?.branchName || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Account Number</dt>
              <dd className="text-sm">{bankDetails?.accountNumber || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Bank Code</dt>
              <dd className="text-sm">{bankDetails?.bankCode || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-muted-foreground">Bank Address</dt>
              <dd className="text-sm">{bankDetails?.address || 'N/A'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Profile Picture</dt>
              <dd className="text-sm">{documents?.profilePicUrl ? 'Uploaded' : 'Not Uploaded'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Aadhar Document</dt>
              <dd className="text-sm">{documents?.aadharDocUrl ? 'Uploaded' : 'Not Uploaded'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Bank Document</dt>
              <dd className="text-sm">{documents?.bankDocUrl ? 'Uploaded' : 'Not Uploaded'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fields?.map((field: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">Field {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Area (Hectares)</dt>
                      <dd className="text-sm">{field.areaHa || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Yield Estimate</dt>
                      <dd className="text-sm">{field.yieldEstimate || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                      <dd className="text-sm">
                        {field.location
                          ? `Lat: ${field.location.lat?.toFixed(6)}, Lng: ${field.location.lng?.toFixed(6)}`
                          : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Land Document</dt>
                      <dd className="text-sm">{field.landDocumentUrl ? 'Uploaded' : 'Not Uploaded'}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
