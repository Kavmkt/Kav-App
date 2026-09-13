#!/usr/bin/env node
/**
 * Popula o Firestore com dados de exemplo do Clube de Presentes:
 *   - pacotes Bronze e Plus
 *   - 6 itens de exemplo (catálogo de presentes)
 *   - (opcional) um usuário + assinatura de teste
 *
 * Uso:
 *   1. Firebase Console > Configurações do projeto > Contas de serviço >
 *      "Gerar nova chave privada" — salve o JSON baixado como
 *      scripts/serviceAccountKey.json (já está no .gitignore, nunca
 *      commite esse arquivo).
 *   2. npm run seed
 *
 * O script usa `set({ merge: true })`, então rodar mais de uma vez é
 * seguro — só atualiza os campos definidos aqui, sem apagar nada além
 * disso nos documentos.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

// -----------------------------------------------------------------------
// Usuário/assinatura de teste (opcional).
//
// Crie o usuário em Firebase Console > Authentication > Users > "Add
// user", copie o "User UID" gerado e cole abaixo. Deixe `null` para
// pular essa parte e popular só pacotes + itens.
// -----------------------------------------------------------------------
const TEST_USER_UID = null; // ex.: 'AbCdEfGh12345IjKlMnOpQrStUvWxYz0'

const PACKAGES = [
  {
    id: 'bronze',
    data: {
      name: 'Pacote Bronze',
      description: '2 presentes por semestre, escolhidos por você.',
      price: 149.9,
      totalDates: 2,
      intervalMonths: 6,
      datesAllowed: [],
    },
  },
  {
    id: 'plus',
    data: {
      name: 'Pacote Plus',
      description: '4 presentes nas datas comemorativas do ano.',
      price: 279.9,
      totalDates: 4,
      intervalMonths: 3,
      datesAllowed: [],
    },
  },
];

const ITEMS = [
  {
    id: 'cesta-cafe-da-manha',
    data: {
      name: 'Cesta Café da Manhã',
      description: 'Cesta artesanal com pães, geleias e frutas selecionadas.',
      imageUrl: '',
      category: 'Cestas',
      isActive: true,
    },
  },
  {
    id: 'vinho-tinto-reserva',
    data: {
      name: 'Vinho Tinto Reserva',
      description: 'Rótulo premiado, ideal para harmonizar com queijos.',
      imageUrl: '',
      category: 'Vinhos',
      isActive: true,
    },
  },
  {
    id: 'buque-flores-do-campo',
    data: {
      name: 'Buquê Flores do Campo',
      description: 'Arranjo colorido com flores frescas da estação.',
      imageUrl: '',
      category: 'Flores',
      isActive: true,
    },
  },
  {
    id: 'cesta-chocolates-belgas',
    data: {
      name: 'Cesta de Chocolates Belgas',
      description: 'Seleção de chocolates belgas em cesta artesanal.',
      imageUrl: '',
      category: 'Chocolates',
      isActive: true,
    },
  },
  {
    id: 'kit-spa-relax',
    data: {
      name: 'Kit Spa Relax',
      description: 'Óleos essenciais, vela aromática e sais de banho.',
      imageUrl: '',
      category: 'Spa',
      isActive: true,
    },
  },
  {
    id: 'kit-cha-especial',
    data: {
      name: 'Kit Chá Especial',
      description: 'Seleção de chás importados com bule de porcelana.',
      imageUrl: '',
      category: 'Chá',
      isActive: true,
    },
  },
];

function loadServiceAccount() {
  try {
    return JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  } catch (err) {
    console.error(
      `\n[seed] Não encontrei "${serviceAccountPath}".\n` +
        'Baixe a chave da conta de serviço em Firebase Console > ' +
        'Configurações do projeto > Contas de serviço > "Gerar nova ' +
        'chave privada" e salve como scripts/serviceAccountKey.json ' +
        '(esse arquivo já está no .gitignore — nunca o commite).\n',
    );
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

async function seedPackages(db) {
  for (const pkg of PACKAGES) {
    await db.collection('packages').doc(pkg.id).set(pkg.data, { merge: true });
    console.log(`  ✓ packages/${pkg.id}`);
  }
}

async function seedItems(db) {
  for (const item of ITEMS) {
    await db.collection('items').doc(item.id).set(item.data, { merge: true });
    console.log(`  ✓ items/${item.id}`);
  }
}

async function seedTestUserAndSubscription(db) {
  if (!TEST_USER_UID) {
    console.log(
      '  ⏭  TEST_USER_UID não definido — pulando usuário/assinatura de teste.\n' +
        '     Crie um usuário em Authentication > Users, copie o UID e\n' +
        '     defina TEST_USER_UID em scripts/seed.js para gerar também\n' +
        '     um cliente de teste com assinatura ativa.',
    );
    return;
  }

  await db
    .collection('users')
    .doc(TEST_USER_UID)
    .set(
      {
        email: 'teste@lilycestas.com.br',
        name: 'Cliente Teste',
        packageId: 'bronze',
        isActive: true,
      },
      { merge: true },
    );
  console.log(`  ✓ users/${TEST_USER_UID}`);

  const today = new Date();
  const startDate = toISODate(today);
  const firstGiftDate = toISODate(addDays(today, 30));
  const endDate = toISODate(addDays(today, 180));

  const subscriptionRef = db.collection('subscriptions').doc();
  await subscriptionRef.set({
    userId: TEST_USER_UID,
    packageId: 'bronze',
    startDate,
    endDate,
    status: 'active',
    // Bronze = 2 presentes/6 meses: uma data em 30 dias (para já poder
    // testar o fluxo de seleção) e outra no fim do período.
    selectedDates: [firstGiftDate, endDate],
  });
  console.log(`  ✓ subscriptions/${subscriptionRef.id}`);
}

async function main() {
  const serviceAccount = loadServiceAccount();
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  console.log('Populando pacotes (Bronze, Plus)...');
  await seedPackages(db);

  console.log('Populando catálogo de itens...');
  await seedItems(db);

  console.log('Usuário e assinatura de teste...');
  await seedTestUserAndSubscription(db);

  console.log('\n✅ Seed concluído.');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Erro ao popular o Firestore:', err);
  process.exit(1);
});
