import { Gender, Relationship } from '@prisma/client';

/**
 * Format a date object or string to a localized date string
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Generate pagination array for rendering page numbers
 */
export const generatePagination = (currentPage: number, totalPages: number) => {
  // If the total number of pages is 7 or less,
  // display all pages without any ellipsis
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is among the first 3 pages,
  // show the first 3, an ellipsis, and the last 2 pages
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages - 1, totalPages];
  }

  // If the current page is among the last 3 pages,
  // show the first 2, an ellipsis, and the last 3 pages
  if (currentPage >= totalPages - 2) {
    return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
  }

  // If the current page is somewhere in the middle,
  // show the first page, an ellipsis, the current page and its neighbors,
  // another ellipsis, and the last page
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
};
export interface FarmerFormData {
  surveyNumber: string;
  name: string;
  relationship: Relationship;
  gender: Gender;
  community: string;
  aadharNumber: string;
  state: string;
  district: string;
  mandal: string;
  village: string;
  panchayath: string;
  dateOfBirth: string;
  age: number;
  contactNumber: string;
  bankDetails?: {
    ifscCode: string;
    bankName: string;
    branchName: string;
    accountNumber: string;
    address: string;
    bankCode: string;
  };
  documents?: {
    profilePicUrl: string;
    aadharDocUrl: string;
    bankDocUrl: string;
  };
  fields?: {
    areaHa: number;
    yieldEstimate: number;
    location: Record<string, object>;
    landDocumentUrl: string;
  }[];
}
