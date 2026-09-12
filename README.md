# Kav App

Aplicativo web para clientes acompanharem, com login e senha próprios,
métricas em tempo real de redes sociais (Instagram) e campanhas de anúncios
(Meta Ads), além de uma área de cursos. Inclui um painel administrativo para
a agência cadastrar clientes, gerenciar credenciais de integração e o
conteúdo dos cursos.

## Stack

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **PostgreSQL** + **Prisma ORM**
- Autenticação própria (cookie httpOnly assinado com JWT via `jose`,
  senha com `bcryptjs`) — sem dependência de provedores externos
- **Tailwind CSS v4** para estilo
- **Recharts** para os gráficos do dashboard

## Como funciona

- **Cliente** (login: e-mail + senha) acessa `/dashboard`: visão geral,
  posts, campanhas (Meta Ads) e cursos.
- **Admin** (agência) acessa `/admin`: cria/gerencia clientes (isso já gera
  o login do cliente com uma senha temporária), configura a integração Meta
  por cliente e gerencia os cursos (módulos e aulas).
- Todo cliente novo já nasce com **dados de demonstração** realistas
  (seguidores, posts, campanhas) gerados automaticamente, para que o painel
  nunca fique vazio enquanto a integração real não é configurada.
- Um botão **"Atualizar agora"** (e uma atualização automática a cada ~45s)
  disparam uma sincronização: se o cliente tiver credenciais Meta
  configuradas, os dados reais são buscados na Graph API / Marketing API;
  caso contrário, o painel simula uma pequena variação "ao vivo" sobre os
  dados de demonstração.

## Configuração

1. Copie o arquivo de variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

2. Ajuste `DATABASE_URL` para apontar para o seu PostgreSQL e gere um
   `AUTH_SECRET` forte (ex: `openssl rand -base64 32`).

3. Instale as dependências e rode as migrations:

   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   ```

   O seed cria:
   - 1 usuário admin: `admin@kavapp.com` / `demo1234`
   - 3 clientes de demonstração (senha `demo1234` para todos), cada um com
     30 dias de métricas, posts e campanhas simuladas
   - 1 curso de exemplo com 3 módulos e 5 aulas

   > **Importante:** troque essas senhas de demonstração antes de usar em
   > produção (o painel admin permite gerar uma nova senha para qualquer
   > cliente a qualquer momento).

4. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000).

## Conectando dados reais da Meta (Instagram + Ads)

Por padrão o app funciona 100% com dados de demonstração. Para exibir dados
reais de um cliente:

1. Crie um app em [developers.facebook.com](https://developers.facebook.com)
   com acesso à **Instagram Graph API** e à **Marketing API**.
2. Gere um token de acesso (de preferência de um *system user*, de longa
   duração) com as permissões `instagram_basic`,
   `instagram_manage_insights` e `ads_read`.
3. No painel admin, abra o cliente desejado e preencha:
   - **Instagram User ID** (ID da conta comercial do Instagram)
   - **Ad Account ID** (ID da conta de anúncios do Meta Ads)
   - **Token de acesso** (ou defina `META_SYSTEM_ACCESS_TOKEN` no `.env`
     para usar o mesmo token em todos os clientes)

A partir daí, o botão "Atualizar agora" e a atualização automática passam a
buscar dados reais em vez de simulados. Toda a lógica de integração fica em
`src/lib/integrations/meta.ts` e `src/lib/data/sync.ts`.

## Scripts

| Comando             | Descrição                                    |
| -------------------- | --------------------------------------------- |
| `npm run dev`         | Servidor de desenvolvimento                   |
| `npm run build`       | Build de produção                             |
| `npm run start`       | Roda o build de produção                      |
| `npm run lint`        | ESLint                                        |
| `npm run db:migrate`  | Roda as migrations do Prisma                  |
| `npm run db:seed`     | Popula o banco com dados de demonstração      |
| `npm run db:studio`   | Abre o Prisma Studio para inspecionar o banco |

## Estrutura do projeto

```
prisma/
  schema.prisma        # Modelos: User, Client, MetricSnapshot, Post,
                        # AdCampaign, AdSpendSnapshot, Course, Module,
                        # Lesson, LessonProgress
  seed.ts               # Popula admin + clientes + curso de exemplo

src/
  app/
    login/               # Tela de login (compartilhada admin/cliente)
    dashboard/            # Área do cliente
    admin/                # Área da agência
    api/auth/logout/      # Logout (route handler)
  components/            # UI, gráficos, layout, formulários admin
  lib/
    auth/                # Sessão (JWT em cookie), senha, guards de rota
    data/                # Consultas ao banco, geração de dados mock, sync
    integrations/meta.ts  # Chamadas reais à Meta Graph/Marketing API
```

## Próximos passos sugeridos

- Fluxo de "esqueci minha senha" para o cliente (hoje o reset é feito pelo
  admin)
- Upload de vídeo/anexos para as aulas (hoje aceita uma URL de vídeo)
- Webhooks da Meta para atualização em tempo real real (em vez de polling)
- Métricas por post vindas da Graph API (hoje só o perfil e os anúncios têm
  integração real; posts usam sempre dados de demonstração)
