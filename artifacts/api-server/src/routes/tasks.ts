import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";
import {
  CreateTaskBody,
  CreateTaskResponse,
  DeleteTaskParams,
  ListTasksResponse,
  UpdateTaskBody,
  UpdateTaskParams,
  UpdateTaskResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const protectedRouter = Router();
protectedRouter.use(requireAuth);

function userIdFrom(res: { locals: { userId?: string } }): string {
  const userId = res.locals.userId;
  if (!userId) throw new Error("Missing authenticated user");
  return userId;
}

function toCalendarDate(value: Date | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

protectedRouter.get("/tasks", async (_req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const tasks = await db
    .select({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      category: tasksTable.category,
      dueDate: tasksTable.dueDate,
      priority: tasksTable.priority,
      subtasks: tasksTable.subtasks,
      completed: tasksTable.completed,
      completedAt: tasksTable.completedAt,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    })
    .from(tasksTable)
    .where(eq(tasksTable.userId, userId))
    .orderBy(asc(tasksTable.completed), asc(tasksTable.dueDate), desc(tasksTable.createdAt));

  const parsedTasks = ListTasksResponse.parse(tasks);
  res.json(parsedTasks.map((task) => ({ ...task, dueDate: toCalendarDate(task.dueDate) })));
});

protectedRouter.post("/tasks", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const body = CreateTaskBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const title = body.data.title.trim();
  if (!title) {
    res.status(400).json({ error: "Topshiriq nomini kiriting." });
    return;
  }

  const [task] = await db
    .insert(tasksTable)
    .values({
      userId,
      title,
      description: body.data.description?.trim() || null,
      category: body.data.category,
      dueDate: toCalendarDate(body.data.dueDate) ?? null,
      priority: body.data.priority ?? "normal",
      subtasks: body.data.subtasks ?? [],
    })
    .returning({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      category: tasksTable.category,
      dueDate: tasksTable.dueDate,
      priority: tasksTable.priority,
      subtasks: tasksTable.subtasks,
      completed: tasksTable.completed,
      completedAt: tasksTable.completedAt,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    });

  const parsedTask = CreateTaskResponse.parse(task);
  res.status(201).json({ ...parsedTask, dueDate: toCalendarDate(parsedTask.dueDate) });
});

protectedRouter.patch("/tasks/:id", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const params = UpdateTaskParams.safeParse(req.params);
  const body = UpdateTaskBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  if (Object.keys(body.data).length === 0) {
    res.status(400).json({ error: "O‘zgartirish uchun ma’lumot kiriting." });
    return;
  }

  const [current] = await db
    .select({
      id: tasksTable.id,
      completed: tasksTable.completed,
      completedAt: tasksTable.completedAt,
    })
    .from(tasksTable)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)))
    .limit(1);
  if (!current) {
    res.status(404).json({ error: "Topshiriq topilmadi." });
    return;
  }

  const updates: Partial<typeof tasksTable.$inferInsert> = {};
  if (body.data.title !== undefined) {
    const title = body.data.title.trim();
    if (!title) {
      res.status(400).json({ error: "Topshiriq nomini kiriting." });
      return;
    }
    updates.title = title;
  }
  if (body.data.description !== undefined) {
    updates.description = body.data.description?.trim() || null;
  }
  if (body.data.category !== undefined) updates.category = body.data.category;
  if (body.data.dueDate !== undefined) updates.dueDate = toCalendarDate(body.data.dueDate);
  if (body.data.priority !== undefined) updates.priority = body.data.priority;
  if (body.data.subtasks !== undefined) updates.subtasks = body.data.subtasks;
  if (body.data.completed !== undefined) {
    updates.completed = body.data.completed;
    updates.completedAt = body.data.completed
      ? current.completedAt ?? new Date()
      : null;
  }

  const [task] = await db
    .update(tasksTable)
    .set(updates)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)))
    .returning({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      category: tasksTable.category,
      dueDate: tasksTable.dueDate,
      priority: tasksTable.priority,
      subtasks: tasksTable.subtasks,
      completed: tasksTable.completed,
      completedAt: tasksTable.completedAt,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    });
  if (!task) {
    res.status(404).json({ error: "Topshiriq topilmadi." });
    return;
  }
  const parsedTask = UpdateTaskResponse.parse(task);
  res.json({ ...parsedTask, dueDate: toCalendarDate(parsedTask.dueDate) });
});

protectedRouter.delete("/tasks/:id", async (req, res): Promise<void> => {
  const userId = userIdFrom(res);
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .delete(tasksTable)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)))
    .returning({ id: tasksTable.id });
  if (!task) {
    res.status(404).json({ error: "Topshiriq topilmadi." });
    return;
  }
  res.sendStatus(204);
});

router.use(protectedRouter);

export default router;