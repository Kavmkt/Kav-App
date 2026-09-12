"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueCourseSlug(base: string): Promise<string> {
  const slugBase = slugify(base) || "curso";
  let slug = slugBase;
  let attempt = 0;
  while (await prisma.course.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${slugBase}-${attempt + 1}`;
  }
  return slug;
}

const createCourseSchema = z.object({
  title: z.string().min(2, "Informe o título do curso."),
  description: z.string().min(2, "Informe uma descrição."),
});

export type CreateCourseState = { error?: string };

export async function createCourseAction(
  _prevState: CreateCourseState,
  formData: FormData
): Promise<CreateCourseState> {
  await requireAdminSession();

  const parsed = createCourseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const slug = await uniqueCourseSlug(parsed.data.title);
  const coverColor = ["#5b4dfb", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899"][
    Math.floor(Math.random() * 5)
  ];
  const coursesCount = await prisma.course.count();

  await prisma.course.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      slug,
      coverColor,
      order: coursesCount,
    },
  });

  revalidatePath("/admin/courses");
  return {};
}

export async function toggleCoursePublishedAction(courseId: string) {
  await requireAdminSession();
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
  });
  await prisma.course.update({
    where: { id: courseId },
    data: { published: !course.published },
  });
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteCourseAction(courseId: string) {
  await requireAdminSession();
  await prisma.course.delete({ where: { id: courseId } });
  revalidatePath("/admin/courses");
}

const createModuleSchema = z.object({
  title: z.string().min(2, "Informe o título do módulo."),
});

export type CreateModuleState = { error?: string };

export async function createModuleAction(
  courseId: string,
  _prevState: CreateModuleState,
  formData: FormData
): Promise<CreateModuleState> {
  await requireAdminSession();

  const parsed = createModuleSchema.safeParse({
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const order = await prisma.module.count({ where: { courseId } });
  await prisma.module.create({
    data: { title: parsed.data.title, courseId, order },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  return {};
}

export async function deleteModuleAction(moduleId: string, courseId: string) {
  await requireAdminSession();
  await prisma.module.delete({ where: { id: moduleId } });
  revalidatePath(`/admin/courses/${courseId}`);
}

const createLessonSchema = z.object({
  title: z.string().min(2, "Informe o título da aula."),
  content: z.string().min(2, "Informe o conteúdo da aula."),
  videoUrl: z.string().optional(),
  durationMinutes: z.coerce.number().int().positive().default(10),
});

export type CreateLessonState = { error?: string };

export async function createLessonAction(
  moduleId: string,
  courseId: string,
  _prevState: CreateLessonState,
  formData: FormData
): Promise<CreateLessonState> {
  await requireAdminSession();

  const parsed = createLessonSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    videoUrl: formData.get("videoUrl") || undefined,
    durationMinutes: formData.get("durationMinutes") || 10,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const order = await prisma.lesson.count({ where: { moduleId } });
  await prisma.lesson.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      videoUrl: parsed.data.videoUrl || null,
      durationMinutes: parsed.data.durationMinutes,
      moduleId,
      order,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  return {};
}

export async function deleteLessonAction(lessonId: string, courseId: string) {
  await requireAdminSession();
  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidatePath(`/admin/courses/${courseId}`);
}
