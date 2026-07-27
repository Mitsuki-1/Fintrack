import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createIncomeSourceSchema, updateIncomeSourceSchema } from './schema';
import * as incomeSourceController from './controller';

const router = Router();

router.use(auth);

router.get('/', incomeSourceController.list);
router.post('/', validate(createIncomeSourceSchema), incomeSourceController.create);
router.patch('/:id', validate(updateIncomeSourceSchema), incomeSourceController.update);
router.delete('/:id', incomeSourceController.remove);

export default router;