# Clube de Presentes — Lily Cestas

MVP de um clube de assinatura de presentes: o cliente faz login, vê as
datas de presente do seu pacote e escolhe (ou troca) o item de cada data
até 15 dias antes dela.

## Stack

- **React.js** com **Vite**
- **Tailwind CSS** para estilo
- **Firebase**
  - **Authentication** (e-mail/senha)
  - **Firestore** (banco de dados)
  - **Storage** (fotos dos itens, se não forem hospedadas em outro lugar)
- **React Router** para as rotas (`/login`, `/`)

Pagamento é único e feito fora do app (ex.: Pix/cartão combinado
diretamente com a cliente); o acesso ao clube é criado manualmente pela
gestora da Lily Cestas depois que o pagamento é confirmado.

## Estrutura do projeto

```
src/
  components/
    Auth/          # Formulário de login
    Dashboard/      # Status do pacote, lista de datas
    Items/          # Galeria de itens, card, modal de seleção
    Common/          # Header, loader, rota protegida
  pages/
    Login/
    Dashboard/
  services/
    firebase.js      # Inicialização do Firebase (auth, db, storage)
    auth.js           # login / logout
    db.js             # Leitura/escrita no Firestore
  context/
    AuthContext.jsx   # Estado global de autenticação
  utils/
    dateHelpers.js    # Regra dos 15 dias, formatação de datas

scripts/
  seed.js              # Popula pacotes/itens de exemplo (firebase-admin)

firebase.json           # Aponta para firestore.rules/indexes e storage.rules
firestore.rules         # Regras de segurança do Firestore
firestore.indexes.json  # Índices compostos (queries com múltiplos where)
storage.rules           # Regras de segurança do Storage
```

## Fluxo do MVP

```
Login → Dashboard (pacote + datas) → Ver itens → Selecionar item
      → Escolher data → Confirmar → Salvo no Firestore
```

Cada data do pacote só pode ser selecionada/trocada enquanto faltarem
**15 dias ou mais** para ela (`MIN_DAYS_FOR_CHANGE` em
`src/utils/dateHelpers.js`). Depois disso o botão fica bloqueado e a
data aparece com "🔒 Prazo de troca encerrado".

## Modelo de dados (Firestore)

Não há admin panel nesta fase — a gestora cria os documentos abaixo
diretamente pelo **Firebase Console > Firestore Database**.

### `users/{uid}`

O `{uid}` do documento deve ser **o mesmo uid** criado em
Authentication para aquele e-mail (Authentication > Users > copiar o
"User UID").

```json
{
  "email": "cliente@email.com",
  "name": "Maria Silva",
  "packageId": "bronze",
  "isActive": true
}
```

### `packages/{packageId}`

Exemplo de pacote Bronze (2 presentes em 6 meses):

```json
{
  "name": "Pacote Bronze",
  "description": "2 presentes por semestre, escolhidos por você.",
  "price": 149.9,
  "totalDates": 2,
  "intervalMonths": 6,
  "datesAllowed": []
}
```

Exemplo de pacote Plus (4 presentes em datas comemorativas):

```json
{
  "name": "Pacote Plus",
  "description": "4 presentes nas datas comemorativas do ano.",
  "price": 279.9,
  "totalDates": 4,
  "intervalMonths": 3,
  "datesAllowed": []
}
```

> `datesAllowed` fica disponível no schema para uma fase futura em que o
> catálogo de datas por pacote é reaproveitado entre assinaturas. No MVP,
> a agenda real de cada cliente vive em `subscriptions.selectedDates`
> (abaixo), definida manualmente pela gestora para cada assinatura.

### `subscriptions/{subscriptionId}`

Uma assinatura ativa por cliente, com a agenda de datas já calculada:

```json
{
  "userId": "<uid do cliente>",
  "packageId": "bronze",
  "startDate": "2026-01-10",
  "endDate": "2026-07-10",
  "status": "active",
  "selectedDates": ["2026-03-15", "2026-07-10"]
}
```

Para o Pacote Plus, `selectedDates` normalmente traz as datas
comemorativas reais do ano (Dia das Mães, Dia dos Namorados, Natal,
aniversário da cliente etc.), já calculadas pela gestora no momento da
criação da assinatura.

### `items/{itemId}`

Catálogo de presentes disponíveis para escolha:

```json
{
  "name": "Cesta de Chocolates Belgas",
  "description": "Seleção de chocolates belgas em cesta artesanal.",
  "imageUrl": "https://.../cesta-chocolates.jpg",
  "category": "Chocolates",
  "isActive": true
}
```

`imageUrl` pode apontar para o Firebase Storage ou qualquer URL pública
de imagem.

### `selections/{subscriptionId_date}`

Criado/atualizado automaticamente pelo app quando o cliente confirma a
escolha de um item para uma data. O id do documento é
`{subscriptionId}_{date}` (ex.: `abc123_2026-03-15`), então repetir a
escolha antes do prazo fechar só atualiza o mesmo documento em vez de
criar duplicados.

```json
{
  "userId": "<uid do cliente>",
  "subscriptionId": "abc123",
  "date": "2026-03-15",
  "itemId": "chocolates-belgas",
  "confirmed": true,
  "changedAt": "<serverTimestamp>"
}
```

## Configurando o Firebase

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication** → aba "Sign-in method" → ative **E-mail/senha**.
   - Para dar acesso a uma cliente: Authentication → Users → "Add user",
     informe e-mail e uma senha temporária, e copie o **User UID** gerado.
3. **Firestore Database** → "Create database" (modo produção) → escolha a
   região.
   - Crie as coleções `users`, `packages`, `items` e `subscriptions` com
     os exemplos acima (o documento de `users/{uid}` usa o UID copiado no
     passo anterior) — ou rode `npm run seed` (veja "Populando dados de
     exemplo" abaixo) para criar pacotes e itens automaticamente.
   - Cole o conteúdo de [`firestore.rules`](./firestore.rules) em
     Firestore Database → **Regras**, e publique. A coleção `selections`
     é criada automaticamente pelo app na primeira escolha do cliente.
   - Em Firestore Database → **Índices** → **Compostos**, crie os índices
     descritos em [`firestore.indexes.json`](./firestore.indexes.json)
     (ou publique tudo de uma vez com a Firebase CLI — veja abaixo).
4. **Storage** (para as fotos dos itens, se não estiverem hospedadas em
   outro lugar) → "Get started" → suba as imagens em `items/<algum-nome>`
   e use a URL pública (ou assinada) em `items.imageUrl`. Cole o
   conteúdo de [`storage.rules`](./storage.rules) em Storage → **Regras**
   — permite leitura para qualquer usuário autenticado e bloqueia upload
   pelo app (as imagens só sobem via Console ou Admin SDK, nesta fase).
5. Em **Configurações do projeto → Seus apps**, adicione um app Web (ícone
   `</>`) e copie o objeto `firebaseConfig`.

### Publicando regras e índices com a Firebase CLI (opcional)

Em vez de colar `firestore.rules`/`storage.rules`/índices manualmente no
Console, com a [Firebase CLI](https://firebase.google.com/docs/cli)
instalada e autenticada (`firebase login`) dá pra publicar tudo de uma vez
— `firebase.json` já referencia os três arquivos:

```bash
firebase use <id-do-seu-projeto>
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

## Rodando localmente

```bash
npm install
cp .env.example .env
# preencha o .env com o firebaseConfig copiado no passo 5 acima
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173) — você será
redirecionado para `/login`.

## Populando dados de exemplo (`scripts/seed.js`)

Script standalone com `firebase-admin` que cria os pacotes Bronze/Plus e 6
itens de exemplo no Firestore (cesta de café da manhã, vinho, flores,
chocolates, kit spa e kit chá) — evita ter que digitar tudo isso à mão no
Console. Opcionalmente também cria um usuário + assinatura de teste.

1. Firebase Console → **Configurações do projeto → Contas de serviço** →
   "Gerar nova chave privada" → salve o arquivo baixado como
   `scripts/serviceAccountKey.json` (esse caminho já está no
   `.gitignore` — **nunca** commite essa chave).
2. (Opcional) Para também criar um cliente de teste com assinatura
   ativa: crie um usuário em **Authentication → Users → Add user**,
   copie o **User UID** e cole na constante `TEST_USER_UID` no topo de
   `scripts/seed.js`. Sem isso o script só popula pacotes e itens.
3. Rode:

   ```bash
   npm run seed
   ```

O script usa `set({ merge: true })`, então rodar mais de uma vez é
seguro — não duplica nem apaga documentos, só atualiza os campos que ele
conhece.

## Scripts

| Comando           | Descrição                                       |
| ------------------ | -------------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento (Vite)               |
| `npm run build`     | Build de produção em `dist/`                     |
| `npm run preview`   | Serve o build de produção localmente             |
| `npm run lint`      | ESLint                                            |
| `npm run seed`      | Popula pacotes/itens de exemplo no Firestore     |

## Fase 2 (não implementado neste MVP)

- Painel administrativo (criar clientes, pacotes, itens e assinaturas
  pela interface, sem depender do Firebase Console)
- E-mails automáticos (confirmação de escolha, lembrete de prazo)
- Histórico de trocas por data (hoje `selections` guarda só o estado
  atual; um histórico exigiria uma subcoleção ou coleção de auditoria)
- Login com Google
