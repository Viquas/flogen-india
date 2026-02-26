import { z } from 'zod'

// Schema for the business_data JSONB column
export const ContactInfoSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    website: z.string().url().optional(),
})

export const BusinessDataSchema = z.object({
    businessName: z.string().min(1, "Business name is required"),
    industry: z.string().optional(), // FR-06: Industry field for cards
    description: z.string().min(1, "Description is required"),
    services: z.array(z.string()).min(1, "At least one service is required"),
    contactInfo: ContactInfoSchema.optional(),
}).passthrough()

// Full Project schema for validation
export const ProjectSchema = z.object({
    id: z.string().uuid().optional(),
    batch_id: z.string().uuid().nullable().optional(),
    business_data: BusinessDataSchema,
    generated_code: z.string().nullable().optional(),
    status: z.enum(['queued', 'generating', 'review', 'approved', 'deployed', 'error']).default('queued'),
    version: z.number().int().positive().default(1),
    thumbnail_url: z.string().url().nullable().optional(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
})

// Type exports
export type ContactInfo = z.infer<typeof ContactInfoSchema>
export type BusinessData = z.infer<typeof BusinessDataSchema>
export type Project = z.infer<typeof ProjectSchema>
