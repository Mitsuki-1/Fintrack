import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createIncomeSchema, updateIncomeSchema } from './schema';
import * as incomeController from './controller';

const router = Router();

router.use(auth);

router.get('/', incomeController.list);
router.get('/:id', incomeController.getById);
router.post('/', validate(createIncomeSchema), incomeController.create);
router.patch('/:id', validate(updateIncomeSchema), incomeController.update);
router.delete('/:id', incomeController.remove);

export default router;