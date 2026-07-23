import { PrismaClient, ActionStatus, Priority, RiskLevel } from "@prisma/client";

const prisma = new PrismaClient();

const baseDate = new Date("2026-07-23T09:00:00.000Z");

const authorities = [
  {
    code: "FDA",
    name: "U.S. Food and Drug Administration",
    region: "North America",
    website: "https://www.fda.gov"
  },
  {
    code: "EMA",
    name: "European Medicines Agency",
    region: "Europe",
    website: "https://www.ema.europa.eu"
  },
  {
    code: "MHRA",
    name: "Medicines and Healthcare products Regulatory Agency",
    region: "United Kingdom",
    website: "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency"
  },
  {
    code: "TGA",
    name: "Therapeutic Goods Administration",
    region: "Australia",
    website: "https://www.tga.gov.au"
  },
  {
    code: "PMDA",
    name: "Pharmaceuticals and Medical Devices Agency",
    region: "Japan",
    website: "https://www.pmda.go.jp"
  },
  {
    code: "ANVISA",
    name: "Brazilian Health Regulatory Agency",
    region: "Latin America",
    website: "https://www.gov.br/anvisa"
  },
  {
    code: "HC",
    name: "Health Canada",
    region: "Canada",
    website: "https://www.canada.ca/en/health-canada.html"
  }
];

const products = [
  "sterile injectables",
  "digital therapeutics",
  "combination devices",
  "cold-chain biologics",
  "AI decision-support software",
  "post-market surveillance packs",
  "API sourcing dossiers",
  "labeling automation workflows"
];

const teams = [
  "Maya Chen",
  "Arjun Patel",
  "Fatima Noor",
  "Lucas Meyer",
  "Hannah Brooks",
  "Wei Zhou",
  "Elena Garcia",
  "Noah Bennett"
];

const directiveThemes = [
  "Labeling update",
  "Adverse event reporting",
  "Clinical data transparency",
  "Manufacturing deviation response",
  "UDI data submission",
  "Post-market surveillance escalation",
  "AI-enabled medical software oversight",
  "Cold-chain excursion documentation",
  "Import alert remediation",
  "Electronic batch record retention",
  "Supplier qualification tightening",
  "Recall classification refinement"
];

const regions = ["US", "EU", "UK", "AU", "JP", "BR", "CA"];

const missingEffectiveDateSet = new Set([3, 9, 16, 24, 33, 41]);
const malformedPayloadSet = new Set([5, 14, 29, 38]);

const priorityOrder: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const riskOrder: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function pick<T>(items: T[], index: number) {
  return items[index % items.length];
}

function createPayload(index: number, authorityCode: string, title: string) {
  const publishedAt = addDays(baseDate, -45 + index).toISOString();
  const extractedAt = addDays(baseDate, -44 + index).toISOString();
  const payload = {
    schemaVersion: "2026.1",
    source: {
      bulletinId: `${authorityCode}-${String(index + 1001)}`,
      publishedAt,
      url: `https://updates.example.com/${authorityCode.toLowerCase()}/${index + 1001}`
    },
    metadata: {
      extractedAt,
      model: "gpt-5-regulatory-extractor",
      confidence: Number((0.82 + (index % 7) * 0.02).toFixed(2))
    },
    impactedProducts: [
      pick(products, index),
      pick(products, index + 3)
    ],
    geography: [pick(regions, index), pick(regions, index + 2)],
    fullText: `${title} requires cross-functional review of updated obligations, submission timelines, and evidence packages before regional rollout.`
  };

  if (!malformedPayloadSet.has(index)) {
    return payload;
  }

  switch (index % 4) {
    case 1:
      return {
        ...payload,
        metadata: undefined
      };
    case 2:
      return {
        ...payload,
        schemaVersion: "2024.experimental"
      };
    case 3:
      return {
        sourceEnvelope: payload.source,
        metadata: payload.metadata,
        narrative: payload.fullText
      };
    default:
      return {
        ...payload,
        source: {
          publishedAt: payload.source.publishedAt
        }
      };
  }
}

async function main() {
  await prisma.actionItem.deleteMany();
  await prisma.complianceDirective.deleteMany();
  await prisma.regulatoryAuthority.deleteMany();

  const createdAuthorities = [];
  for (const authority of authorities) {
    const created = await prisma.regulatoryAuthority.create({ data: authority });
    createdAuthorities.push(created);
  }

  let actionItemCursor = 0;
  const directiveCount = 48;

  for (let index = 0; index < directiveCount; index += 1) {
    const authority = createdAuthorities[index % createdAuthorities.length];
    const theme = pick(directiveThemes, index);
    const title = `${theme} for ${pick(products, index + 1)} in ${authority.region}`;
    const summary = `Cross-border compliance teams must assess ${theme.toLowerCase()} requirements affecting ${pick(products, index + 2)} and downstream evidence packages in ${authority.code}.`;
    const riskLevel = pick(riskOrder, index + 1);
    const effectiveDate = missingEffectiveDateSet.has(index)
      ? null
      : addDays(baseDate, -20 + (index % 17));
    const rawPayload = createPayload(index, authority.code, title);

    const actionItems = Array.from({ length: 1 + (index % 3) }).map((_, actionIndex) => {
      const currentCursor = actionItemCursor;
      actionItemCursor += 1;

      const missingDueDate = currentCursor % 9 === 0;
      const conflictingState = currentCursor % 11 === 0 && !missingDueDate;
      const defaultStatus = pick<ActionStatus>(
        ["PENDING", "IN_REVIEW", "PENDING", "REJECTED"],
        currentCursor + actionIndex
      );

      const status = conflictingState ? "RESOLVED" : defaultStatus;
      const dueDate = missingDueDate
        ? null
        : conflictingState
          ? addDays(baseDate, -6 - (currentCursor % 5))
          : addDays(baseDate, -3 + (currentCursor % 21));
      const flagReason = conflictingState
        ? null
        : currentCursor % 7 === 0
          ? "Requires legal interpretation of cross-jurisdiction wording drift."
          : currentCursor % 5 === 0
            ? "Awaiting authority acknowledgement on scope threshold."
            : null;

      return {
        title: `${theme} workstream ${actionIndex + 1}`,
        assignedTo: pick(teams, currentCursor),
        status,
        priority: pick(priorityOrder, currentCursor + index),
        dueDate,
        flagReason
      };
    });

    await prisma.complianceDirective.create({
      data: {
        authorityId: authority.id,
        title,
        summary,
        riskLevel,
        effectiveDate,
        rawPayload,
        actionItems: {
          create: actionItems
        }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

