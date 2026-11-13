import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'LIBRARIAN', 'STUDENT']).default('STUDENT'),
  department: z.string().optional(),
  course: z.string().optional(),
  rollNumber: z.string().optional(),
  phone: z.string().optional(),
});

export const bookSchema = z.object({
  title: z.string().min(1, 'Book title is required'),
  author: z.string().min(1, 'Author name is required'),
  isbn: z.string().min(3, 'ISBN is required'),
  publisher: z.string().min(1, 'Publisher is required'),
  pubYear: z.coerce.number().int().min(1800).max(2100),
  categoryId: z.string().min(1, 'Category is required'),
  language: z.string().default('English'),
  description: z.string().optional().nullable(),
  totalCopies: z.coerce.number().int().min(1, 'At least 1 copy is required'),
  shelfNumber: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
});

export const memberSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  regNumber: z.string().optional().nullable(),
  department: z.string().min(1, 'Department is required'),
  course: z.string().min(1, 'Course is required'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  maxBooksAllowed: z.coerce.number().int().min(1).default(4),
  status: z.enum(['ACTIVE', 'BLOCKED', 'EXPIRED']).default('ACTIVE'),
});

export const issueBookSchema = z.object({
  bookId: z.string().min(1, 'Please select a book'),
  memberId: z.string().min(1, 'Please select a member'),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().optional().nullable(),
});

export const returnBookSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  notes: z.string().optional().nullable(),
});

export const folderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100),
  parentId: z.string().optional().nullable(),
  category: z.string().default('Academic Materials'),
  allowedRoles: z.enum(['ALL', 'ADMIN_LIBRARIAN', 'ADMIN_ONLY']).default('ALL'),
});

export const reservationSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  notes: z.string().optional().nullable(),
});
