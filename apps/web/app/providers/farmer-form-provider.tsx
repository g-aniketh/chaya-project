'use client';

import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FarmerWithRelations } from '../(dashboard)/farmers/lib/types';
import { createFarmerSchema } from '@chaya/shared';
import { useFarmerFormStore } from '../stores/farmer-form';

interface FarmerFormProviderProps {
  children: React.ReactNode;
  initialData?: FarmerWithRelations;
  mode?: 'add' | 'edit';
}

export function FarmerFormProvider({ children, initialData, mode = 'add' }: FarmerFormProviderProps) {
  const defaultValues = initialData
    ? {
        farmer: {
          name: initialData.name,
          relationship: initialData.relationship,
          gender: initialData.gender,
          community: initialData.community,
          aadharNumber: initialData.aadharNumber,
          dateOfBirth: initialData.dateOfBirth.toISOString().split('T')[0],
          age: initialData.age,
          contactNumber: initialData.contactNumber,
          state: initialData.state,
          district: initialData.district,
          mandal: initialData.mandal,
          village: initialData.village,
          panchayath: initialData.panchayath,
          isActive: initialData.isActive,
        },
        bankDetails: initialData.bankDetails || {
          ifscCode: '',
          bankName: '',
          branchName: '',
          accountNumber: '',
          address: '',
          bankCode: '',
        },
        documents: initialData.documents
          ? {
              profilePicUrl: initialData.documents.profilePicUrl,
              aadharDocUrl: initialData.documents.aadharDocUrl,
              bankDocUrl: initialData.documents.bankDocUrl,
            }
          : {
              profilePicUrl: '',
              aadharDocUrl: '',
              bankDocUrl: '',
            },
        fields:
          initialData.fields && initialData.fields.length > 0
            ? initialData.fields.map(
                (field: { areaHa: any; yieldEstimate: any; location: any; landDocumentUrl: any }) => ({
                  areaHa: field.areaHa,
                  yieldEstimate: field.yieldEstimate,
                  location: field.location,
                  landDocumentUrl: field.landDocumentUrl,
                })
              )
            : [
                {
                  areaHa: 0,
                  yieldEstimate: 0,
                  location: {
                    lat: 0,
                    lng: 0,
                    accuracy: 0,
                    altitude: null,
                    altitudeAccuracy: null,
                    timestamp: Date.now(),
                  },
                  landDocumentUrl: '',
                },
              ],
      }
    : {
        farmer: {
          name: '',
          relationship: 'SELF' as const,
          gender: 'MALE' as const,
          community: '',
          aadharNumber: '',
          dateOfBirth: '',
          age: 0,
          contactNumber: '',
          state: '',
          district: '',
          mandal: '',
          village: '',
          panchayath: '',
          isActive: true,
        },
        bankDetails: {
          ifscCode: '',
          bankName: '',
          branchName: '',
          accountNumber: '',
          address: '',
          bankCode: '',
        },
        documents: {
          profilePicUrl: '',
          aadharDocUrl: '',
          bankDocUrl: '',
        },
        fields: [
          {
            areaHa: 0,
            yieldEstimate: 0,
            location: {
              lat: 0,
              lng: 0,
              accuracy: 0,
              altitude: null,
              altitudeAccuracy: null,
              timestamp: Date.now(),
            },
            landDocumentUrl: '',
          },
        ],
      };

  const form = useForm({
    resolver: zodResolver(createFarmerSchema) as any,
    defaultValues: defaultValues as any,
    mode: 'onChange',
  });

  const setForm = useFarmerFormStore((state: { setForm: any }) => state.setForm);

  useEffect(() => {
    setForm(form);

    return () => {
      setForm(null);
    };
  }, [form, setForm]);

  return <FormProvider {...form}>{children}</FormProvider>;
}
