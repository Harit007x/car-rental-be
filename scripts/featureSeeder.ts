import type { PrismaClient } from "../src/generated/prisma/client";

const FEATURES = [
  {
    key: "priority_support",
    name: "Priority Support",
    description: "Priority support access for faster query resolution.",
  },
  {
    key: "advanced_reports",
    name: "Advanced Reports",
    description: "Advanced analytics and reporting dashboard.",
  },
  {
    key: "custom_branding",
    name: "Custom Branding",
    description: "Custom brand assets and white-label options.",
  },
  {
    key: "api_access",
    name: "API Access",
    description: "Secure API access for integrations.",
  },
];

export const seedFeatures = async (prisma: PrismaClient) => {
  for (const feature of FEATURES) {
    await prisma.feature.upsert({
      where: { key: feature.key },
      update: {
        name: feature.name,
        description: feature.description,
      },
      create: feature,
    });
  }
};
