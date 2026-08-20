import { Router, Request, Response } from 'express';
import { userService } from '../services/userService';
import { CreateUserSchema } from '../schemas';

const router = Router();

// GET /api/users
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'User ID must be a valid integer' });
    }

    const user = await userService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: `User with ID ${id} not found` });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/users
router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = CreateUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues
      });
    }

    const user = await userService.createUser(validation.data);
    res.status(201).json(user);
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
});

export default router;
