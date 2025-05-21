# Chaya App Backend Documentation

## Project Overview

We've built a comprehensive backend system for the Chaya App, an internal dashboard tool for an NGO working with farmers. The system follows a modern architecture using Fastify for the API server,
Prisma for database interactions, and integrates with a Next.js frontend through a monorepo structure.

## Technical Architecture

### Monorepo Structure

```
chaya-freelance/
├── apps/
│   ├── api/             # Fastify backend
│   └── web/             # Next.js frontend
├── packages/
│   └── shared/          # Shared code, Prisma schema, and types
├── .env                 # Environment variables for all apps
└── turbo.json           # Turborepo configuration
```

### Technology Stack

- **Backend**: Fastify with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod for schema validation
- **Authentication**: JWT-based with cookies
- **File Storage**: UploadThing for storing documents and images
- **Development**: Bun runtime for improved performance

## Database Schema

The database consists of the following main entities:

1. **User**: Admin and staff users of the system
2. **Farmer**: Primary entity with personal and contact information
3. **BankDetails**: Banking information related to farmers
4. **FarmerDocuments**: Document URLs for farmers' profile pictures and important documents
5. **Field**: Information about farm fields belonging to farmers

## API Routes

### Authentication Routes

#### POST `/api/auth/login`

Authenticates a user and returns a JWT token.

**Request Body**:

```json
{
  "email": "admin@chaya.org",
  "password": "admin123"
}
```

**Response**:

```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@chaya.org",
    "role": "ADMIN"
  }
}
```

#### POST `/api/auth/logout`

Logs out the current user.

**Response**:

```json
{
  "success": true
}
```

#### GET `/api/auth/me`

Returns the current authenticated user.

**Response**:

```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@chaya.org",
    "role": "ADMIN"
  }
}
```

#### POST `/api/auth/register`

Registers a new staff user (admin only).

**Request Body**:

```json
{
  "name": "New Staff",
  "email": "newstaff@chaya.org",
  "password": "password123",
  "role": "STAFF"
}
```

**Response**:

```json
{
  "user": {
    "id": 3,
    "name": "New Staff",
    "email": "newstaff@chaya.org",
    "role": "STAFF"
  }
}
```

### User Management Routes (Admin Only)

#### GET `/api/users`

Lists all staff users.

**Response**:

```json
{
  "users": [
    {
      "id": 2,
      "name": "Staff User",
      "email": "staff@chaya.org",
      "role": "STAFF",
      "isEnabled": true,
      "isActive": false,
      "lastLoginAt": null,
      "createdAt": "2023-06-15T10:30:00.000Z"
    }
  ]
}
```

#### GET `/api/users/:id`

Gets a specific user by ID.

**Response**:

```json
{
  "user": {
    "id": 2,
    "name": "Staff User",
    "email": "staff@chaya.org",
    "role": "STAFF",
    "isEnabled": true,
    "isActive": false,
    "lastLoginAt": null,
    "createdAt": "2023-06-15T10:30:00.000Z"
  }
}
```

#### PUT `/api/users/:id`

Updates a user (admin only).

**Request Body**:

```json
{
  "name": "Updated Staff Name",
  "isEnabled": true
}
```

**Response**:

```json
{
  "user": {
    "id": 2,
    "name": "Updated Staff Name",
    "email": "staff@chaya.org",
    "role": "STAFF",
    "isEnabled": true,
    "isActive": false
  }
}
```

#### PATCH `/api/users/:id/toggle-status`

Toggles a user's enabled status (admin only).

**Response**:

```json
{
  "user": {
    "id": 2,
    "name": "Staff User",
    "email": "staff@chaya.org",
    "role": "STAFF",
    "isEnabled": false
  }
}
```

#### DELETE `/api/users/:id`

Deletes a staff user (admin only).

**Response**:

```json
{
  "success": true
}
```

### Farmer Management Routes

#### GET `/api/farmers`

Lists farmers with pagination and filtering.

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term (optional)
- `state`: Filter by state (optional)
- `district`: Filter by district (optional)
- `gender`: Filter by gender (optional)
- `isActive`: Filter by active status (default: true)

**Response**:

```json
{
  "farmers": [
    {
      "id": 1,
      "name": "Farmer Name",
      "surveyNumber": "12345",
      "aadharNumber": "123456789012",
      "gender": "MALE",
      "state": "Karnataka",
      "isActive": true,
      "documents": {
        "profilePicUrl": "https://example.com/pic.jpg",
        "aadharDocUrl": "https://example.com/aadhar.pdf",
        "bankDocUrl": "https://example.com/bank.pdf"
      },
      "bankDetails": {
        "bankName": "State Bank",
        "accountNumber": "12345678901"
      },
      "fields": [
        {
          "id": 1,
          "areaHa": 2.5,
          "yieldEstimate": 500
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 45,
    "totalPages": 5
  }
}
```

#### GET `/api/farmers/:id`

Gets a specific farmer by ID.

**Response**:

```json
{
  "farmer": {
    "id": 1,
    "name": "Farmer Name",
    "surveyNumber": "12345",
    "aadharNumber": "123456789012",
    "gender": "MALE",
    "state": "Karnataka",
    "documents": {
      "profilePicUrl": "https://example.com/pic.jpg",
      "aadharDocUrl": "https://example.com/aadhar.pdf",
      "bankDocUrl": "https://example.com/bank.pdf"
    },
    "bankDetails": {
      "bankName": "State Bank",
      "accountNumber": "12345678901"
    },
    "fields": [
      {
        "id": 1,
        "areaHa": 2.5,
        "yieldEstimate": 500,
        "location": {
          "latitude": 12.9716,
          "longitude": 77.5946
        },
        "landDocumentUrl": "https://example.com/land.pdf"
      }
    ]
  }
}
```

#### POST `/api/farmers`

Creates a new farmer.

**Request Body**:

```json
{
  "farmer": {
    "name": "New Farmer",
    "surveyNumber": "12345",
    "relationship": "SELF",
    "gender": "MALE",
    "community": "General",
    "aadharNumber": "123456789012",
    "state": "Karnataka",
    "district": "Bangalore Rural",
    "mandal": "Nelamangala",
    "village": "Soladevanahalli",
    "panchayath": "Solur",
    "dateOfBirth": "1985-05-15",
    "age": 38,
    "contactNumber": "9876543210"
  },
  "bankDetails": {
    "ifscCode": "SBIN0001234",
    "bankName": "State Bank of India",
    "branchName": "Solur Branch",
    "accountNumber": "12345678901",
    "address": "Main Road, Solur",
    "bankCode": "SBI001"
  },
  "documents": {
    "profilePicUrl": "https://example.com/pic.jpg",
    "aadharDocUrl": "https://example.com/aadhar.pdf",
    "bankDocUrl": "https://example.com/bank.pdf"
  },
  "fields": [
    {
      "areaHa": 2.5,
      "yieldEstimate": 500,
      "location": {
        "latitude": 12.9716,
        "longitude": 77.5946
      },
      "landDocumentUrl": "https://example.com/land.pdf"
    }
  ]
}
```

**Response**:

```json
{
  "farmer": {
    "id": 1,
    "name": "New Farmer",
    "surveyNumber": "12345",
    "gender": "MALE",
    "state": "Karnataka",
    "documents": {
      "profilePicUrl": "https://example.com/pic.jpg"
    },
    "bankDetails": {
      "bankName": "State Bank of India"
    },
    "fields": [
      {
        "id": 1,
        "areaHa": 2.5,
        "yieldEstimate": 500
      }
    ]
  }
}
```

#### PUT `/api/farmers/:id`

Updates a farmer (admin only).

**Request Body** (partial update example):

```json
{
  "farmer": {
    "name": "Updated Farmer Name",
    "contactNumber": "9876543211"
  },
  "bankDetails": {
    "accountNumber": "98765432109"
  }
}
```

**Response**:

```json
{
  "farmer": {
    "id": 1,
    "name": "Updated Farmer Name",
    "contactNumber": "9876543211",
    "bankDetails": {
      "accountNumber": "98765432109"
    }
  }
}
```

#### PATCH `/api/farmers/:id/toggle-status`

Toggles a farmer's active status (admin only).

**Response**:

```json
{
  "farmer": {
    "id": 1,
    "name": "Farmer Name",
    "isActive": false
  }
}
```

#### DELETE `/api/farmers/:id`

Deletes a farmer (admin only).

**Response**:

```json
{
  "success": true
}
```

#### GET `/api/farmers/export`

Exports farmers data as CSV.

**Query Parameters**: Same as the GET `/api/farmers` endpoint

**Response**: CSV file download

### Field Management Routes

#### GET `/api/fields/farmer/:farmerId`

Gets all fields for a specific farmer.

**Response**:

```json
{
  "fields": [
    {
      "id": 1,
      "areaHa": 2.5,
      "yieldEstimate": 500,
      "location": {
        "latitude": 12.9716,
        "longitude": 77.5946
      },
      "landDocumentUrl": "https://example.com/land.pdf",
      "farmerId": 1,
      "createdAt": "2023-06-15T10:30:00.000Z",
      "updatedAt": "2023-06-15T10:30:00.000Z"
    }
  ]
}
```

#### GET `/api/fields/:id`

Gets a specific field by ID.

**Response**:

```json
{
  "field": {
    "id": 1,
    "areaHa": 2.5,
    "yieldEstimate": 500,
    "location": {
      "latitude": 12.9716,
      "longitude": 77.5946
    },
    "landDocumentUrl": "https://example.com/land.pdf",
    "farmerId": 1,
    "createdAt": "2023-06-15T10:30:00.000Z",
    "updatedAt": "2023-06-15T10:30:00.000Z"
  }
}
```

#### POST `/api/fields/farmer/:farmerId`

Adds a new field to a farmer.

**Request Body**:

```json
{
  "areaHa": 3.5,
  "yieldEstimate": 700,
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "landDocumentUrl": "https://example.com/newland.pdf"
}
```

**Response**:

```json
{
  "field": {
    "id": 2,
    "areaHa": 3.5,
    "yieldEstimate": 700,
    "location": {
      "latitude": 12.9716,
      "longitude": 77.5946
    },
    "landDocumentUrl": "https://example.com/newland.pdf",
    "farmerId": 1,
    "createdAt": "2023-06-16T10:30:00.000Z",
    "updatedAt": "2023-06-16T10:30:00.000Z"
  }
}
```

#### PUT `/api/fields/:id`

Updates a field.

**Request Body**:

```json
{
  "areaHa": 4.0,
  "yieldEstimate": 800
}
```

**Response**:

```json
{
  "field": {
    "id": 2,
    "areaHa": 4.0,
    "yieldEstimate": 800,
    "location": {
      "latitude": 12.9716,
      "longitude": 77.5946
    },
    "landDocumentUrl": "https://example.com/newland.pdf",
    "farmerId": 1,
    "updatedAt": "2023-06-17T10:30:00.000Z"
  }
}
```

#### DELETE `/api/fields/:id`

Deletes a field (admin only).

**Response**:

```json
{
  "success": true
}
```

## Authentication Flow

1. **Login**: Users log in with their email and password via `/api/auth/login`. A JWT token is returned and stored in an HTTP-only cookie.
2. **Access Control**: The `authenticate` middleware checks for a valid token in cookies, and the `verifyAdmin` middleware ensures only admin users can access certain routes.
3. **Logout**: Users log out via `/api/auth/logout`, which clears the JWT cookie.

## File Upload Flow

1. The frontend uses UploadThing to handle file uploads directly from the browser.
2. After successful upload, UploadThing returns URLs for the uploaded files.
3. These URLs are sent to the backend as part of the farmer creation/update requests.
4. The backend stores these URLs in the appropriate document fields in the database.

## User Roles and Permissions

### Admin User

- Can create, read, update, and delete all data
- Can create and manage staff users
- Can toggle staff user access
- Can export data

### Staff User

- Can read all farmer data
- Can create new farmers
- Cannot update or delete farmers
- Cannot access user management features

## Database Seeding

A seed file is available to create initial admin and staff users for testing:

- Admin: `admin@chaya.org` / `admin123`
- Staff: `staff@chaya.org` / `staff123`

## Running the Application

1. **Environment Setup**: Copy the `.env.example` to `.env` and fill in the details
2. **Database Setup**: Run `pnpm db:migrate` and `pnpm db:seed`
3. **Start Backend**: Run `pnpm dev` in the root directory to start both frontend and backend

## Future Enhancements

1. **Procurement Module**: For tracking farmer produce procurement
2. **Processing Module**: For tracking post-harvest processing
3. **Advanced Analytics**: For more detailed metrics and reporting
4. **Mobile Responsiveness**: For field staff to use on mobile devices

This backend implementation provides a solid foundation for the Chaya App, with proper authentication, role-based access control, and comprehensive data management features for farmers and their
fields.
