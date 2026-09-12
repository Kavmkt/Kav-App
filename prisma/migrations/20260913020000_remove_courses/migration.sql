-- DropTable: a área de cursos foi removida do app (pedido explícito do
-- cliente). CASCADE cuida da ordem de dependência entre as tabelas
-- (LessonProgress -> Lesson -> Module -> Course) e de qualquer FK que
-- aponte pra elas.
DROP TABLE IF EXISTS "LessonProgress" CASCADE;
DROP TABLE IF EXISTS "Lesson" CASCADE;
DROP TABLE IF EXISTS "Module" CASCADE;
DROP TABLE IF EXISTS "Course" CASCADE;
