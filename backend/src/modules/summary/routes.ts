import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as summaryController from './controller';

const router = Router();

router.use(auth);

router.get('/', summaryController.getSummary);
router.get('/by-category', summaryController.getSummaryByCategory);
router.get('/by-source', summaryController.getSummaryBySource);
router.get('/recurring', summaryController.getRecurring);

export default router;