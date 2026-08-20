import { Router, Request, Response } from 'express';
import { externalApiService } from '../services/externalApiService';
import { userService } from '../services/userService';

const router = Router();

// GET /api/external/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const result = await externalApiService.fetchExternalUsers(forceRefresh);

    // Cross-reference with existing database users
    const existingUsers = await userService.getAllUsers();
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

    const enrichedData = result.data.map(u => ({
      ...u,
      isImported: existingEmails.has(u.email.toLowerCase())
    }));

    res.json({
      ...result,
      data: enrichedData
    });
  } catch (error: any) {
    console.error('Error fetching external users:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch external API data',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/external/import
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { name, email, role, avatar } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required for import' });
    }

    const newUser = await userService.createUser({
      name,
      email,
      role: role || 'Member',
      avatar: avatar || null
    });

    res.status(201).json({
      success: true,
      message: `User ${name} successfully imported into TaskFlow directory`,
      user: newUser
    });
  } catch (error: any) {
    console.error('Error importing external user:', error);
    res.status(400).json({ error: error.message || 'Import failed' });
  }
});

export default router;
