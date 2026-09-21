
import Joi from "joi";

/*
|--------------------------------------------------------------------------
| Common values
|--------------------------------------------------------------------------
*/

const languages = [
  "english",
  "juba_arabic",
  "dinka",
  "nuer",
  "other",
];

const priorities = [
  "low",
  "normal",
  "high",
  "urgent",
];

const reportCategories = [
  "security",
  "violence",
  "displacement",
  "misinformation",
  "service_disruption",
  "humanitarian",
  "other",
];

const urgencyLevels = [
  "low",
  "medium",
  "high",
  "critical",
];

const alertStatuses = [
  "verified",
  "unverified",
  "contested",
  "emerging_signal",
];

const truthStatuses = [
  "verified",
  "unverified",
  "contested",
  "false",
  "partially_verified",
];

const riskLevels = [
  "low",
  "medium",
  "high",
  "critical",
];

const civicCategories = [
  "rights",
  "services",
  "safety",
  "reporting",
  "governance",
  "elections",
  "documentation",
  "other",
];

const sourceTypes = [
  "official",
  "institutional",
  "independent_media",
  "community",
  "international",
  "user_submitted",
  "other",
];

const reliabilityLevels = [
  "high",
  "medium",
  "unknown",
];

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

/*
 * Public registration.
 *
 * Important:
 * - Users cannot select their role.
 * - All public registrations become "analyst".
 * - role is intentionally not included here.
 */
export const registerSchema = Joi.object({
  fullName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Full name is required.",
      "string.min":
        "Full name must contain at least 2 characters.",
      "string.max":
        "Full name cannot exceed 100 characters.",
      "any.required":
        "Full name is required.",
    }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .max(150)
    .required()
    .messages({
      "string.empty": "Email is required.",
      "string.email":
        "Please provide a valid email address.",
      "string.max":
        "Email cannot exceed 150 characters.",
      "any.required":
        "Email is required.",
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      "string.empty": "Password is required.",
      "string.min":
        "Password must contain at least 8 characters.",
      "string.max":
        "Password cannot exceed 128 characters.",
      "any.required":
        "Password is required.",
    }),
});

/*
 * Login.
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .max(150)
    .required()
    .messages({
      "string.empty": "Email is required.",
      "string.email":
        "Please provide a valid email address.",
      "string.max":
        "Email cannot exceed 150 characters.",
      "any.required":
        "Email is required.",
    }),

  password: Joi.string()
    .min(1)
    .max(128)
    .required()
    .messages({
      "string.empty": "Password is required.",
      "string.max":
        "Password cannot exceed 128 characters.",
      "any.required":
        "Password is required.",
    }),
});

/*
|--------------------------------------------------------------------------
| Verification
|--------------------------------------------------------------------------
*/

export const createVerificationSchema = Joi.object({
  claim: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .required()
    .messages({
      "string.empty": "Claim is required.",
      "string.min":
        "Claim must contain at least 10 characters.",
      "string.max":
        "Claim cannot exceed 2000 characters.",
      "any.required": "Claim is required.",
    }),

  language: Joi.string()
    .valid(...languages)
    .default("english"),

  sourceUrl: Joi.string()
    .uri({
      scheme: [
        "http",
        "https",
      ],
    })
    .max(1000)
    .allow(null, "")
    .default(null),

  context: Joi.string()
    .trim()
    .max(1000)
    .allow(null, "")
    .default(null),

  evidence: Joi.array()
    .items(
      Joi.object({
        sourceId: Joi.string()
          .hex()
          .length(24)
          .required(),

        title: Joi.string()
          .trim()
          .max(300)
          .allow(null, "")
          .default(null),

        url: Joi.string()
          .uri({
            scheme: ["http", "https"],
          })
          .max(1000)
          .allow(null, "")
          .default(null),

        publishedAt: Joi.date()
          .allow(null, "")
          .default(null),

        content: Joi.string()
          .trim()
          .max(4000)
          .allow(null, "")
          .default(null),
      }).unknown(false)
    )
    .max(10)
    .default([]),

  priority: Joi.string()
    .valid(...priorities)
    .default("normal"),
});

/*
|--------------------------------------------------------------------------
| Verification Result
|--------------------------------------------------------------------------
*/

export const createVerificationResultSchema =
  Joi.object({
    truthStatus: Joi.string()
      .valid(...truthStatuses)
      .required(),

    riskLevel: Joi.string()
      .valid(...riskLevels)
      .required(),

    confidence: Joi.number()
      .min(0)
      .max(1)
      .allow(null)
      .default(null),

    summary: Joi.string()
      .trim()
      .min(10)
      .max(2000)
      .required(),

    reasoning: Joi.string()
      .trim()
      .max(5000)
      .allow(null, "")
      .default(null),

    evidence: Joi.array()
      .items(
        Joi.object({
          evidenceId: Joi.string()
            .trim()
            .max(20)
            .required(),

          sourceId: Joi.string()
            .hex()
            .length(24)
            .required(),

          source: Joi.string()
            .trim()
            .max(200)
            .allow(null, "")
            .default(null),

          sourceType: Joi.string()
            .trim()
            .max(100)
            .allow(null, "")
            .default(null),

          reliabilityLevel: Joi.string()
            .valid("high", "medium", "unknown")
            .allow(null)
            .default("unknown"),

          sourceTier: Joi.number()
            .valid(1, 2, 3, 4)
            .required(),

          title: Joi.string()
            .trim()
            .max(300)
            .allow(null, "")
            .default(null),

          url: Joi.string()
            .uri({
              scheme: ["http", "https"],
            })
            .max(1000)
            .allow(null, "")
            .default(null),

          date: Joi.string()
            .trim()
            .max(100)
            .allow(null, "")
            .default(null),

          relevance: Joi.string()
            .trim()
            .max(1000)
            .allow(null, "")
            .default(null),
        }).unknown(false)
      )
      .max(20)
      .default([]),

    uncertainties: Joi.array()
      .items(Joi.string().trim().max(500))
      .max(20)
      .default([]),

    recommendedAction: Joi.string()
      .trim()
      .max(2000)
      .allow(null, "")
      .default(null),

    evidenceSufficiency: Joi.string()
      .valid("sufficient", "conflicting", "insufficient")
      .allow(null)
      .default(null),

    reviewRequired: Joi.boolean()
      .default(false),

    reviewReason: Joi.string()
      .valid("insufficient_evidence", "manual_review", "technical_failure")
      .allow(null)
      .default(null),

    verifiedAt: Joi.date()
      .allow(null)
      .default(null),

    reviewedBy: Joi.string()
      .hex()
      .length(24)
      .allow(null)
      .default(null),

    aiGenerated: Joi.boolean()
      .default(false),
  });

/*
|--------------------------------------------------------------------------
| Reports
|--------------------------------------------------------------------------
*/

export const createReportSchema = Joi.object({
  description: Joi.string()
    .trim()
    .min(10)
    .max(3000)
    .required()
    .messages({
      "string.empty":
        "Description is required.",
      "string.min":
        "Description must contain at least 10 characters.",
      "string.max":
        "Description cannot exceed 3000 characters.",
      "any.required":
        "Description is required.",
    }),

  location: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required(),

  incidentDate: Joi.date()
    .allow(null, "")
    .default(null),

  category: Joi.string()
    .valid(...reportCategories)
    .required(),

  urgency: Joi.string()
    .valid(...urgencyLevels)
    .default("medium"),

  contactName: Joi.string()
    .trim()
    .max(100)
    .allow(null, "")
    .default(null),

  contactPhone: Joi.string()
    .trim()
    .max(30)
    .allow(null, "")
    .default(null),

  contactEmail: Joi.string()
    .email()
    .max(150)
    .allow(null, "")
    .default(null),

  isAnonymous: Joi.boolean()
    .default(true),
});

/*
|--------------------------------------------------------------------------
| Report Status
|--------------------------------------------------------------------------
*/

export const updateReportStatusSchema =
  Joi.object({
    status: Joi.string()
      .valid(
        "received",
        "under_review",
        "verified",
        "unverified",
        "closed"
      )
      .required(),
  });

/*
|--------------------------------------------------------------------------
| Alerts
|--------------------------------------------------------------------------
*/

export const createAlertSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .required(),

  summary: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .required(),

  location: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required(),

  category: Joi.string()
    .valid(...reportCategories)
    .required(),

  status: Joi.string()
    .valid(...alertStatuses)
    .required(),

  riskLevel: Joi.string()
    .valid(...riskLevels)
    .default("medium"),

  source: Joi.string()
    .hex()
    .length(24)
    .allow(null)
    .default(null),

  publishedAt: Joi.date()
    .allow(null)
    .default(null),

  expiresAt: Joi.date()
    .allow(null)
    .default(null),

  isPublished: Joi.boolean()
    .default(false),

  createdBy: Joi.string()
    .hex()
    .length(24)
    .allow(null)
    .default(null),
});

/*
|--------------------------------------------------------------------------
| Alert Updates
|--------------------------------------------------------------------------
*/

export const updateAlertSchema =
  Joi.object({
    title: Joi.string()
      .trim()
      .min(5)
      .max(200),

    summary: Joi.string()
      .trim()
      .min(10)
      .max(2000),

    location: Joi.string()
      .trim()
      .min(2)
      .max(200),

    category: Joi.string()
      .valid(...reportCategories),

    status: Joi.string()
      .valid(...alertStatuses),

    riskLevel: Joi.string()
      .valid(...riskLevels),

    source: Joi.string()
      .hex()
      .length(24)
      .allow(null),

    publishedAt: Joi.date()
      .allow(null),

    expiresAt: Joi.date()
      .allow(null),

    isPublished: Joi.boolean(),
  })
  .min(1);

/*
|--------------------------------------------------------------------------
| Civic Information
|--------------------------------------------------------------------------
*/

export const createCivicInformationSchema =
  Joi.object({
    title: Joi.string()
      .trim()
      .min(5)
      .max(200)
      .required(),

    summary: Joi.string()
      .trim()
      .min(10)
      .max(2000)
      .required(),

    content: Joi.string()
      .trim()
      .min(10)
      .max(10000)
      .required(),

    category: Joi.string()
      .valid(...civicCategories)
      .required(),

    language: Joi.string()
      .valid(...languages)
      .default("english"),

    source: Joi.string()
      .hex()
      .length(24)
      .allow(null)
      .default(null),

    sourceUrl: Joi.string()
      .uri({
        scheme: [
          "http",
          "https",
        ],
      })
      .max(1000)
      .allow(null, "")
      .default(null),

    lastVerifiedAt: Joi.date()
      .allow(null)
      .default(null),

    isPublished: Joi.boolean()
      .default(false),
  });

/*
|--------------------------------------------------------------------------
| Civic Information Updates
|--------------------------------------------------------------------------
*/

export const updateCivicInformationSchema =
  Joi.object({
    title: Joi.string()
      .trim()
      .min(5)
      .max(200),

    summary: Joi.string()
      .trim()
      .min(10)
      .max(2000),

    content: Joi.string()
      .trim()
      .min(10)
      .max(10000),

    category: Joi.string()
      .valid(...civicCategories),

    language: Joi.string()
      .valid(...languages),

    source: Joi.string()
      .hex()
      .length(24)
      .allow(null),

    sourceUrl: Joi.string()
      .uri({
        scheme: [
          "http",
          "https",
        ],
      })
      .max(1000)
      .allow(null, ""),

    lastVerifiedAt: Joi.date()
      .allow(null),

    isPublished: Joi.boolean(),
  })
  .min(1);

/*
|--------------------------------------------------------------------------
| Sources
|--------------------------------------------------------------------------
*/

export const createSourceSchema =
  Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(200)
      .required(),

    url: Joi.string()
      .uri({
        scheme: [
          "http",
          "https",
        ],
      })
      .max(1000)
      .allow(null, "")
      .default(null),

    type: Joi.string()
      .valid(...sourceTypes)
      .required(),

    reliabilityLevel: Joi.string()
      .valid(...reliabilityLevels)
      .default("unknown"),

    description: Joi.string()
      .trim()
      .max(1000)
      .allow(null, "")
      .default(null),

    lastCheckedAt: Joi.date()
      .allow(null)
      .default(null),

    isActive: Joi.boolean()
      .default(true),
  });

/*
|--------------------------------------------------------------------------
| Source Updates
|--------------------------------------------------------------------------
*/

export const updateSourceSchema =
  Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(200),

    url: Joi.string()
      .uri({
        scheme: [
          "http",
          "https",
        ],
      })
      .max(1000)
      .allow(null, ""),

    type: Joi.string()
      .valid(...sourceTypes),

    reliabilityLevel: Joi.string()
      .valid(...reliabilityLevels),

    description: Joi.string()
      .trim()
      .max(1000)
      .allow(null, ""),

    lastCheckedAt: Joi.date()
      .allow(null),

    isActive: Joi.boolean(),
  })
  .min(1);

export const sendSmsSchema = Joi.object({
  recipient: Joi.string().trim().min(9).max(20).required(),
  messageType: Joi.string()
    .valid(
      "report_acknowledgement",
      "report_status",
      "verification_result",
      "alert_notification"
    )
    .required(),
  message: Joi.string().trim().min(1).max(1600).required(),
}).unknown(false);

export const sendAlertSmsSchema = Joi.object({
  recipient: Joi.string().trim().min(9).max(20).required(),
}).unknown(false);

export const smsDeliveryWebhookSchema = Joi.object({
  providerMessageId: Joi.string().trim().max(200).required(),
  status: Joi.string().valid("delivered", "failed").required(),
  deliveredAt: Joi.date().allow(null).default(null),
  errorMessage: Joi.string().trim().max(500).allow(null, "").default(null),
}).unknown(false);

