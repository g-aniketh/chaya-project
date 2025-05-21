'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@workspace/ui/components/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Textarea } from '@workspace/ui/components/textarea';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function BankDetailsSection() {
  const { control, setValue, setError, clearErrors } = useFormContext();
  const [loadingIFSC, setLoadingIFSC] = useState(false);

  const handleIFSCChange = async (ifscCode: string) => {
    if (!ifscCode || ifscCode.length !== 11) {
      return;
    }

    setLoadingIFSC(true);
    clearErrors('bankDetails.ifscCode');

    try {
      const response = await fetch(`https://ifsc.razorpay.com/${ifscCode}`);
      if (!response.ok) {
        setError('bankDetails.ifscCode', {
          type: 'manual',
          message: 'Failed to fetch IFSC details. Please check the code.',
        });
        toast.error('Failed to fetch IFSC details. Please verify the code.');
        return;
      }

      const data = await response.json();
      setValue('bankDetails.branchName', data.BRANCH || '', {
        shouldValidate: true,
      });
      setValue('bankDetails.address', data.ADDRESS || '', {
        shouldValidate: true,
      });
      setValue('bankDetails.bankName', data.BANK || '', {
        shouldValidate: true,
      });
      setValue('bankDetails.bankCode', data.BANKCODE || '', {
        shouldValidate: true,
      });
      toast.success('IFSC details fetched successfully.');
    } catch (error) {
      console.error('Error fetching IFSC details:', error);
      setError('bankDetails.ifscCode', {
        type: 'manual',
        message: 'Failed to fetch IFSC details due to a network error.',
      });
      toast.error('Network error while fetching IFSC details. Please try again later.');
    } finally {
      setLoadingIFSC(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="bankDetails.ifscCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IFSC Code</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder="Enter IFSC code"
                    {...field}
                    onChange={e => {
                      const value = e.target.value.toUpperCase();
                      field.onChange(value);
                      if (value.length === 11) {
                        handleIFSCChange(value);
                      }
                    }}
                    maxLength={11}
                    className={loadingIFSC ? 'pr-10' : ''}
                  />
                </FormControl>
                {loadingIFSC && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <FormMessage />
              <p className="text-xs text-muted-foreground mt-1">Enter a valid IFSC code to auto-fill bank details</p>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="bankDetails.bankName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter bank name" {...field} disabled={loadingIFSC} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="bankDetails.branchName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter branch name" {...field} disabled={loadingIFSC} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="bankDetails.accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter account number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="bankDetails.bankCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Code</FormLabel>
              <FormControl>
                <Input placeholder="Enter bank code" {...field} disabled={loadingIFSC} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="bankDetails.address"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Bank Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter bank address" className="resize-none" {...field} disabled={loadingIFSC} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
