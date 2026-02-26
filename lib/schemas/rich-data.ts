import { z } from 'zod'

// Helper schemas based on the user's JSON structure
export const ManifestSchema = z.object({
    version: z.string(),
    generator: z.string(),
    generatedAt: z.string(),
    entityId: z.string(),
    validationSchema: z.string().optional()
})

export const GlobalConfigurationSchema = z.object({
    localization: z.object({
        defaultLocale: z.string(),
        supportedLocales: z.array(z.string()),
        direction: z.enum(['ltr', 'rtl']),
        currency: z.object({
            code: z.string(),
            symbol: z.string(),
            displayFormat: z.string()
        }),
        measurementSystem: z.string().optional()
    }),
    technical: z.object({
        pwa: z.object({
            enabled: z.boolean(),
            manifest: z.object({
                shortName: z.string().optional(),
                themeColor: z.string().optional(),
                backgroundColor: z.string().optional(),
                display: z.string().optional()
            }).optional()
        }).optional(),
        analytics: z.object({
            providers: z.array(z.any()).optional(), // Loose schema for providers
            eventMapping: z.record(z.string(), z.any()).optional()
        }).optional()
    }).optional()
})

export const BrandIdentitySchema = z.object({
    core: z.object({
        legalName: z.string().optional(),
        brandName: z.string(),
        branchName: z.string().optional(),
        foundingDate: z.string().optional(),
        taxonomies: z.record(z.string(), z.string()).optional()
    }),
    voice: z.object({
        personality: z.record(z.string(), z.string()).optional(),
        writingGuidelines: z.object({
            forbiddenTerms: z.array(z.string()).optional(),
            preferredTerms: z.array(z.string()).optional(),
            maxSentenceLength: z.number().optional()
        }).optional()
    }).optional(),
    designSystem: z.object({
        colors: z.object({
            semantic: z.record(z.string(), z.object({
                hex: z.string(),
                rgb: z.string().optional(),
                hsl: z.string().optional(),
                usage: z.string().optional()
            })),
            contrastRatios: z.record(z.string(), z.number()).optional()
        }),
        typography: z.object({
            headings: z.object({
                family: z.string(),
                weights: z.array(z.number()),
                fallback: z.string().optional()
            }),
            body: z.object({
                family: z.string(),
                weights: z.array(z.number()),
                fallback: z.string().optional()
            })
        })
    }).optional()
})

export const ContentRepositorySchema = z.object({
    media: z.object({
        heroVideo: z.any().optional(),
        logo: z.object({
            vector: z.string().optional(),
            raster: z.any().optional(),
            favicon: z.array(z.any()).optional()
        }).optional(),
        // Allow flexible media fields
    }).passthrough().optional(),
    navigation: z.object({
        header: z.any().optional(),
        footer: z.any().optional()
    }).optional(),
    pages: z.record(z.string(), z.any()).optional()
})

export const OperationalDataSchema = z.object({
    geo: z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        placeId: z.string().optional(),
        address: z.string().optional()
    }).optional(),
    contact: z.object({
        phone: z.object({
            primary: z.string().optional(),
            display: z.string().optional(),
            hours: z.string().optional()
        }).optional(),
        email: z.record(z.string(), z.string()).optional(),
        social: z.record(z.string(), z.string()).optional()
    }).optional(),
    schedules: z.object({
        timezone: z.string().optional(),
        standard: z.array(z.any()).optional(),
        exceptions: z.array(z.any()).optional()
    }).optional(),
    accessibility: z.any().optional()
})

export const IntegrationsSchema = z.record(z.string(), z.any()).optional()

const SectionSchema = z.object({
    id: z.string(),
    component: z.string(),
    props: z.record(z.string(), z.any())
})

// The main schema based on the user's JSON
export const RichBusinessDataSchema = z.object({
    // Legacy fields for backward compatibility with existing UI components
    businessName: z.string(),
    description: z.string(),
    services: z.array(z.string()),
    contactInfo: z.object({
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        website: z.string().optional()
    }).optional(),

    // New Rich Structure
    $$manifest: ManifestSchema.optional(),
    globalConfiguration: GlobalConfigurationSchema.optional(),
    brandIdentity: BrandIdentitySchema,
    contentRepository: ContentRepositorySchema.optional(),
    operationalData: OperationalDataSchema.optional(),
    integrations: IntegrationsSchema.optional(),

    // Phase 4: Modular generation
    sections: z.array(SectionSchema).optional()
})

export type RichBusinessData = z.infer<typeof RichBusinessDataSchema>
