import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerWalletSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, underscores, and hyphens')
    .trim(),
});

export type RegisterWalletFormData = z.infer<typeof registerWalletSchema>;

export const registerUserSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be at most 50 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, underscores, and hyphens')
      .trim(),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    fullName: z.string().optional(),
    dateOfBirth: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterUserFormData = z.infer<typeof registerUserSchema>;

export const topupSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a valid number' })
    .gt(0, 'Amount must be greater than 0')
    .lt(10000000, 'Amount must be strictly less than 10,000,000'),
});

export type TopupFormData = z.infer<typeof topupSchema>;

export const transferSchema = z.object({
  to_username: z
    .string()
    .min(1, 'Recipient username is required')
    .trim(),
  amount: z
    .number({ invalid_type_error: 'Amount must be a valid number' })
    .gt(0, 'Amount must be greater than 0'),
});

export type TransferFormData = z.infer<typeof transferSchema>;
