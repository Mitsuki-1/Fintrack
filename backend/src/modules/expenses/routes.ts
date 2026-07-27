import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createExpenseSchema, updateExpenseSchema } from './schema';
import * as expenseController from './controller';

const router = Router();

router.use(auth);

router.get('/', expenseController.list);
router.get('/:id', expenseController.getById);
router.post('/', validate(createExpenseSchema), expenseController.create);
router.patch('/:id', validate(updateExpenseSchema), expenseController.update);
router.delete('/:id', expenseController.remove);

export default router;