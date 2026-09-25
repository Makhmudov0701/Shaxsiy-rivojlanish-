import { Router, type IRouter } from "express";
import healthRouter from "./health";
import diaryRouter from "./diary";
import settingsRouter from "./settings";
import exportRouter from "./export";
import repetitionRouter from "./repetition";
import tasksRouter from "./tasks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(diaryRouter);
router.use(settingsRouter);
router.use(exportRouter);
router.use(repetitionRouter);
router.use(tasksRouter);

export default router;
