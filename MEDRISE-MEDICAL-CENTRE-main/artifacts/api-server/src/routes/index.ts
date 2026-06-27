import { Router } from 'express';
import appointmentsRouter from './appointments';

const router = Router();

// mount all appointment routes
router.use(appointmentsRouter);

export default router;
