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
  const adminEmail = "admin@kavapp.com";
  const adminPasswordHash = await hashPassword(DEMO_PASSWORD);
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Administrador Kav",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      mustChangePassword: false,
    },
    update: {},
  });
  console.log(`Admin: ${adminEmail} / ${DEMO_PASSWORD}`);

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
      `Cliente criado: ${spec.companyName} (${spec.contactEmail} / ${DEMO_PASSWORD})`
    );
  }

  // --- Curso de demonstração ---
  const existingCourse = await prisma.course.findUnique({
    where: { slug: "instagram-para-negocios" },
  });
  if (!existingCourse) {
    await prisma.course.create({
      data: {
        title: "Instagram para Negócios",
        slug: "instagram-para-negocios",
        description:
          "Aprenda a estruturar seu perfil, criar conteúdo e usar métricas para vender mais.",
        coverColor: "#5b4dfb",
        order: 0,
        modules: {
          create: [
            {
              title: "Primeiros passos",
              order: 0,
              lessons: {
                create: [
                  {
                    title: "Configurando um perfil profissional",
                    order: 0,
                    durationMinutes: 8,
                    content:
                      "Neste conteúdo você vai aprender a configurar sua conta comercial no Instagram, conectar ao Facebook e liberar o acesso às métricas detalhadas (Insights).\n\nPasso a passo:\n1. Vá em Configurações > Conta > Mudar para conta profissional.\n2. Escolha a categoria do seu negócio.\n3. Conecte a uma Página do Facebook (necessário para anúncios).\n4. Preencha bio, link e informações de contato.",
                  },
                  {
                    title: "Entendendo as métricas principais",
                    order: 1,
                    durationMinutes: 10,
                    content:
                      "Seguidores, alcance, impressões e engajamento: entenda o que cada métrica realmente significa e qual delas observar de acordo com o seu objetivo (crescimento, vendas ou reconhecimento de marca).",
                  },
                ],
              },
            },
            {
              title: "Criando conteúdo que converte",
              order: 1,
              lessons: {
                create: [
                  {
                    title: "Como planejar seu calendário de posts",
                    order: 0,
                    durationMinutes: 12,
                    content:
                      "Um calendário editorial simples ajuda a manter consistência. Vamos montar um modelo com 3 pilares de conteúdo: institucional, educativo e promocional.",
                  },
                  {
                    title: "Reels: o que está funcionando agora",
                    order: 1,
                    durationMinutes: 15,
                    content:
                      "Os Reels seguem sendo o formato com maior potencial de alcance orgânico. Veja os elementos que os vídeos com melhor desempenho têm em comum.",
                  },
                ],
              },
            },
            {
              title: "Investindo em anúncios (Meta Ads)",
              order: 2,
              lessons: {
                create: [
                  {
                    title: "Como interpretar o investimento no seu painel",
                    order: 0,
                    durationMinutes: 9,
                    content:
                      "Vamos entender os principais indicadores de uma campanha: CPC, CTR, impressões e resultados — tudo isso já disponível na aba Campanhas do seu painel.",
                  },
                ],
              },
            },
          ],
        },
      },
    });
    console.log("Curso de demonstração criado.");
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
