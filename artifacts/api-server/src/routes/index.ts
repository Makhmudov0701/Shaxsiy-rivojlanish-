import { Router, type IRouter } from "express";
import healthRouter from "./health";
import diaryRouter from "./diary";

const router: IRouter = Router();

router.use(healthRouter);
router.use(diaryRouter);

export default router;
