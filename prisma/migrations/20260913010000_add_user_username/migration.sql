-- AlterTable: adiciona a coluna ainda opcional pra poder popular as linhas
-- existentes antes de travar como NOT NULL/UNIQUE.
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Backfill dos usuários conhecidos deste projeto (admin + clientes de
-- demonstração do seed). O cliente real Pontocar (hoje logando com o
-- e-mail pessoal kesleysampaio03@gmail.com) é DELIBERADAMENTE deixado de
-- fora daqui — ele cai na rede de segurança abaixo e ganha um username
-- provisório; a troca final pro username/senha definitivos ("pontocar" /
-- "pontocar123") acontece em prisma/seed.ts, que também precisa gerar o
-- hash da senha nova (bcrypt não dá pra fazer em SQL puro de forma
-- portável) e usa esse username provisório como sinal de "ainda não migrei
-- essa conta" — se fizéssemos isso aqui, o seed nunca saberia se já rodou.
UPDATE "User" SET "username" = 'admin' WHERE "email" = 'admin@kavapp.com' AND "username" IS NULL;
UPDATE "User" SET "username" = 'lojadamaria' WHERE "email" = 'cliente@lojadamaria.com' AND "username" IS NULL;
UPDATE "User" SET "username" = 'studiobella' WHERE "email" = 'cliente@studiobella.com' AND "username" IS NULL;
UPDATE "User" SET "username" = 'academiavigor' WHERE "email" = 'cliente@academiavigor.com' AND "username" IS NULL;

-- Rede de segurança: qualquer linha que não bata com nenhum dos casos
-- acima (o Pontocar incluso, de propósito — veja o comentário logo acima)
-- ganha um username provisório derivado do e-mail + um pedaço do id, só
-- pra nunca deixar a coluna nula quando ela virar NOT NULL logo abaixo.
UPDATE "User"
SET "username" = lower(regexp_replace(split_part("email", '@', 1), '[^a-zA-Z0-9]', '', 'g')) || '-' || substr("id", 1, 6)
WHERE "username" IS NULL;

-- AlterTable: agora sim trava como obrigatório e único.
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
