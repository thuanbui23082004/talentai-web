import { z } from 'zod';

export const accountSchema = z.object({
  id: z.uuid(), email: z.email(), fullName: z.string(), phone: z.string().optional(), address: z.string().optional(), avatarUrl: z.string().optional(),
  role: z.enum(['candidate', 'recruiter', 'admin']), status: z.enum(['active', 'locked']), companyId: z.uuid().optional(),
  companyVerificationStatus: z.enum(['unverified', 'pending', 'verified', 'rejected', 'suspended']).optional(), createdAt: z.iso.datetime(), lastLoginAt: z.iso.datetime().optional(),
});
export type Account = z.infer<typeof accountSchema>;
export const accountInputSchema = z.object({
  fullName: z.string().trim().min(2, 'nameLength').max(100, 'nameLength'),
  phone: z.string().regex(/^[0-9+\-\s]{8,15}$/, 'phone').or(z.literal('')),
  address: z.string().trim().max(255, 'addressLength'),
});
export const accountPatchSchema = accountInputSchema.partial().extend({ phone: z.string().regex(/^[0-9+\-\s]{8,15}$/).optional() }).strict();
export const passwordInputSchema = z.object({
  currentPassword: z.string().min(1, 'required'),
  newPassword: z.string().min(8, 'passwordRules').max(64, 'passwordRules').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'passwordRules'),
  confirmPassword: z.string().min(1, 'required'),
}).strict().refine(values => values.newPassword === values.confirmPassword, { path: ['confirmPassword'], message: 'passwordMismatch' });
export const imageTypes = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const imageFileSchema = z.instanceof(File).refine(file => file.size > 0, 'fileEmpty').refine(file => file.size <= 2 * 1024 * 1024, 'fileSize').refine(file => imageTypes.includes(file.type as typeof imageTypes[number]), 'imageType');
