import { Router, Request, Response } from 'express';
import User from '../models/User';
import { generateToken } from '../utils/jwt';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Check password (plain text for demo)
    if (user.password !== password) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    // Return user data (without sensitive information)
    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      preferredDisplayName: user.preferredDisplayName,
      email: user.email,
      username: user.username,
      profilePicture: user.profilePicture,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Login successful',
      user: userData,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to authenticate user'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  // For JWT, logout is handled client-side by removing the token
  res.json({
    message: 'Logout successful'
  });
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authentication token is required'
      });
    }

    // Verify token and get user
    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.userId).select('-password -transferPin -securityAnswer');

    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    // Return user data
    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      preferredDisplayName: user.preferredDisplayName,
      email: user.email,
      username: user.username,
      profilePicture: user.profilePicture,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt
    };

    res.json({
      user: userData
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed'
    });
  }
});

export default router;






