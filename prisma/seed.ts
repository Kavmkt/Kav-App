import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import {
  generateAdSeries,
  generateCampaigns,
  generateMetricSeries,
  generatePosts,
} from "../src/lib/data/mock";

const prisma = new PrismaClient();

type DemoClientSpec = {
  companyName: string;
  slug: string;
  username: string;
  contactEmail: string;
  instagramHandle: string;
  logoColor: string;
  plan: string;
  startFollowers: number;
  dailyGrowth: number;
  dailyBudget: number;
};

const DEMO_CLIENTS: DemoClientSpec[] = [
  {
    companyName: "Loja da Maria",
    slug: "loja-da-maria",
    username: "lojadamaria",
    contactEmail: "cliente@lojadamaria.com",
    instagramHandle: "lojadamaria",
    logoColor: "#5b4dfb",
    plan: "Essencial",
    startFollowers: 4200,
    dailyGrowth: 9,
    dailyBudget: 60,
  },
  {
    companyName: "Studio Bella Estética",
    slug: "studio-bella-estetica",
    username: "studiobella",
    contactEmail: "cliente@studiobella.com",
    instagramHandle: "studiobella.estetica",
    logoColor: "#ec4899",
    plan: "Performance",
    startFollowers: 8600,
    dailyGrowth: 14,
    dailyBudget: 120,
  },
  {
    companyName: "Academia Vigor",
    slug: "academia-vigor",
    username: "academiavigor",
    contactEmail: "cliente@academiavigor.com",
    instagramHandle: "academiavigor",
    logoColor: "#10b981",
    plan: "Performance",
    startFollowers: 12500,
    dailyGrowth: 18,
    dailyBudget: 150,
  },
];

const DEMO_PASSWORD = "demo1234";

async function main() {
  console.log("Seeding banco de dados...");

  // --- Admin ---
  const adminUsername = "admin";
  const adminEmail = "admin@kavapp.com";
  const adminPasswordHash = await hashPassword(DEMO_PASSWORD);
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      username: adminUsername,
      email: adminEmail,
      name: "Administrador Kav",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      mustChangePassword: false,
    },
    update: {},
  });
  console.log(`Admin: usuário "${adminUsername}" / ${DEMO_PASSWORD}`);

  // --- Migração pontual: cliente real Pontocar, que hoje ainda loga com o
  // e-mail pessoal do responsável pela agência. A migration.sql (rodada
  // logo antes deste seed, em todo deploy) já preenche um username
  // PROVISÓRIO pra essa linha (derivado do e-mail, no formato
  // "kesleysampaio03-xxxxxx") só pra satisfazer a constraint NOT NULL —
  // usamos isso aqui como sinal de "essa conta ainda não foi migrada pro
  // usuário/senha definitivos". Assim que rodar uma vez e virar "pontocar",
  // esse padrão nunca mais bate, então isso nunca roda de novo — nem se o
  // admin resetar a senha dele depois por outro motivo.
  const PONTOCAR_LEGACY_EMAIL = "kesleysampaio03@gmail.com";
  const pontocarUser = await prisma.user.findUnique({
    where: { email: PONTOCAR_LEGACY_EMAIL },
  });
  const looksLikeProvisionalUsername = /^kesleysampaio03-[a-z0-9]+$/i.test(
    pontocarUser?.username ?? ""
  );
  if (pontocarUser && looksLikeProvisionalUsername) {
    await prisma.user.update({
      where: { id: pontocarUser.id },
      data: {
        username: "pontocar",
        passwordHash: await hashPassword("pontocar123"),
        mustChangePassword: false,
      },
    });
    console.log('Cliente Pontocar migrado: usuário "pontocar" / senha "pontocar123".');
  }

  // --- Clientes de demonstração ---
  for (const spec of DEMO_CLIENTS) {
    const existing = await prisma.client.findUnique({
      where: { slug: spec.slug },
    });
    if (existing) {
      console.log(`Cliente "${spec.companyName}" já existe, pulando.`);
      continue;
    }

    const passwordHash = await hashPassword(DEMO_PASSWORD);
    const client = await prisma.client.create({
      data: {
        companyName: spec.companyName,
        slug: spec.slug,
        contactEmail: spec.contactEmail,
        instagramHandle: spec.instagramHandle,
        logoColor: spec.logoColor,
        plan: spec.plan,
        users: {
          create: {
            username: spec.username,
            email: spec.contactEmail,
            name: spec.companyName,
            passwordHash,
            role: "CLIENT",
            mustChangePassword: false,
          },
        },
      },
    });

    const metricSeries = generateMetricSeries({
      startFollowers: spec.startFollowers,
      dailyGrowth: spec.dailyGrowth,
      seed: spec.startFollowers,
    });
    const adSeries = generateAdSeries({
      dailyBudget: spec.dailyBudget,
      seed: spec.startFollowers + 1,
    });
    const posts = generatePosts({
      followers: metricSeries.at(-1)!.followers,
      seed: spec.startFollowers + 2,
    });
    const campaigns = generateCampaigns({
      baseDailyBudget: spec.dailyBudget,
      seed: spec.startFollowers + 3,
    });

    await prisma.metricSnapshot.createMany({
      data: metricSeries.map((m) => ({ ...m, clientId: client.id })),
    });
    await prisma.adSpendSnapshot.createMany({
      data: adSeries.map((a) => ({ ...a, clientId: client.id })),
    });
    await prisma.post.createMany({
      data: posts.map((p) => ({ ...p, clientId: client.id })),
    });
    await prisma.adCampaign.createMany({
      data: campaigns.map((c) => ({ ...c, clientId: client.id })),
    });

    console.log(
      `Cliente criado: ${spec.companyName} (usuário "${spec.username}" / ${DEMO_PASSWORD})`
    );
  }

  console.log("Seed finalizado.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
