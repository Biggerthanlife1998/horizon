import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User';
import Account from '../models/Account';
import Transaction from '../models/Transaction';
import Card from '../models/Card';
import { generateTransactionRules, calculateAccountDistribution } from '../utils/transactionRules';
import { generateTransactionHistory } from '../utils/transactionGenerator';
import { generateUserCards } from '../utils/cardGenerator';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// POST /api/admin/create-user
router.post('/create-user', upload.single('profilePicture'), async (req: Request, res: Response) => {
  try {
    // Verify admin password
    const adminPassword = req.headers['x-admin-password'] || req.body.adminPassword;
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid admin password'
      });
    }

    const {
      firstName,
      lastName,
      preferredDisplayName,
      address,
      phoneNumber,
      email,
      username,
      password,
      checkingBalance,
      savingsBalance,
      creditLimit,
      includeTransactionHistory,
      isAdmin
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !preferredDisplayName || !address || !phoneNumber || 
        !email || !username || !password || !checkingBalance || !savingsBalance || !creditLimit) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'All required fields must be provided'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email or username already exists'
      });
    }

    // Create user
    const user = new User({
      firstName,
      lastName,
      preferredDisplayName,
      address,
      phoneNumber,
      email,
      username,
      password, // Store as plain text for demo
      profilePicture: req.file ? req.file.filename : null,
      isAdmin: isAdmin === 'true',
      transferPin: '1234', // Default transfer PIN for demo
      securityQuestion: 'What was the name of your first pet?',
      securityAnswer: 'demo' // Default for demo
    });

    await user.save();

    // Calculate total balance for transaction rules (including credit limit)
    const totalBalance = parseFloat(checkingBalance) + parseFloat(savingsBalance) + parseFloat(creditLimit);
    
    // Generate transaction rules based on total balance
    const transactionRules = generateTransactionRules(totalBalance);
    
    // Use provided account balances instead of calculating distribution
    const accountDistribution = {
      checking: parseFloat(checkingBalance),
      savings: parseFloat(savingsBalance),
      credit: parseFloat(creditLimit)
    };

    // Create account
    const account = new Account({
      userId: user._id,
      totalBalance: totalBalance,
      accountDistribution,
      creationDate: new Date(),
      includeTransactionHistory: includeTransactionHistory === 'true',
      transactionRules
    });

    await account.save();

    // Generate cards for the user
    let cardsGenerated = 0;
    try {
      console.log('Generating cards for user:', user.username);
      const generatedCards = await generateUserCards(
        (user._id as any).toString(),
        user.firstName,
        user.lastName,
        accountDistribution
      );
      
      console.log('Generated cards:', generatedCards.length);
      
      // Save cards to database
      const savedCards = await Card.insertMany(generatedCards);
      cardsGenerated = savedCards.length;
      console.log(`Successfully created ${cardsGenerated} cards for user ${user.username}`);
    } catch (error) {
      console.error('Failed to generate cards:', error);
      // Don't fail the user creation if card generation fails
    }

    // Generate transaction history if requested
    let transactionCount = 0;
    if (includeTransactionHistory === 'true') {
      try {
        console.log('Starting transaction generation for user:', user.username);
        console.log('User ID:', (user._id as any).toString());
        console.log('Total Balance:', account.totalBalance);
        console.log('Credit Limit:', creditLimit);
        console.log('Transaction Rules:', transactionRules);
        
        const generatedTransactions = generateTransactionHistory(
          (user._id as any).toString(),
          account.totalBalance,
          transactionRules,
          6, // Generate 6 months of history
          parseFloat(creditLimit),
          user.createdAt // Pass user creation date for dynamic history
        );

        console.log('Generated transactions count:', generatedTransactions.length);
        console.log('First few transactions:', generatedTransactions.slice(0, 3));

        // Save all transactions to database
        console.log('Creating transaction documents...');
        const transactionDocs = generatedTransactions.map(tx => new Transaction(tx));
        console.log('Sample transaction doc:', transactionDocs[0]);
        
        console.log('Attempting to insert transactions...');
        const savedTransactions = await Transaction.insertMany(transactionDocs);
        
        transactionCount = savedTransactions.length;
        console.log(`Successfully saved ${transactionCount} transactions for user ${user.username}`);
      } catch (error) {
        console.error('Failed to generate transaction history:', error);
        console.error('Error details:', (error as any).message);
        console.error('Stack trace:', (error as any).stack);
        // Don't fail the user creation if transaction generation fails
      }
    }

    // Return user summary (without sensitive data)
    const userSummary = {
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

    res.status(201).json({
      message: 'User created successfully',
      user: userSummary,
      account: {
        totalBalance: account.totalBalance,
        accountDistribution: account.accountDistribution
      },
      transactionHistory: includeTransactionHistory === 'true' ? {
        generated: true,
        count: transactionCount,
        monthsBack: 6
      } : {
        generated: false
      },
      cards: {
        generated: true,
        count: cardsGenerated
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create user'
    });
  }
});

// GET /api/admin/debug-transactions/:userId
router.get('/debug-transactions/:userId', async (req: Request, res: Response) => {
  try {
    // Verify admin password
    const adminPassword = req.headers['x-admin-password'];
    if (!adminPassword || adminPassword.toString().trim() !== process.env.ADMIN_PASSWORD?.trim()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid admin password'
      });
    }

    const { userId } = req.params;
    const account = await Account.findOne({ userId });
    
    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'Account not found for user'
      });
    }

    // Test transaction generation
    const user = await User.findById(userId);
    const generatedTransactions = generateTransactionHistory(
      userId,
      account.totalBalance,
      account.transactionRules as any,
      6,
      account.accountDistribution.credit,
      user?.createdAt
    );

    res.json({
      userId,
      accountTotalBalance: account.totalBalance,
      creditLimit: account.accountDistribution.credit,
      transactionRules: account.transactionRules,
      generatedTransactionsCount: generatedTransactions.length,
      sampleTransactions: generatedTransactions.slice(0, 5)
    });

  } catch (error) {
    console.error('Debug transactions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to debug transactions'
    });
  }
});

// DELETE /api/admin/cleanup - Remove all test users and their data
router.delete('/cleanup', async (req: Request, res: Response) => {
  try {
    // Verify admin password
    const adminPassword = req.headers['x-admin-password'];
    if (!adminPassword || adminPassword.toString().trim() !== process.env.ADMIN_PASSWORD?.trim()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid admin password'
      });
    }

    // Delete all transactions
    const transactionResult = await Transaction.deleteMany({});
    
    // Delete all accounts
    const accountResult = await Account.deleteMany({});
    
    // Delete all users
    const userResult = await User.deleteMany({});

    res.json({
      message: 'Database cleanup completed successfully',
      deleted: {
        users: userResult.deletedCount,
        accounts: accountResult.deletedCount,
        transactions: transactionResult.deletedCount
      }
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to cleanup database'
    });
  }
});

// PUT /api/admin/set-transfer-pin/:userId
router.put('/set-transfer-pin/:userId', async (req: Request, res: Response) => {
  try {
    // Verify admin password
    const adminPassword = req.headers['x-admin-password'];
    if (!adminPassword || adminPassword.toString().trim() !== process.env.ADMIN_PASSWORD?.trim()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid admin password'
      });
    }

    const { userId } = req.params;
    const { transferPin } = req.body;

    if (!transferPin || transferPin.length !== 4 || !/^\d{4}$/.test(transferPin)) {
      return res.status(400).json({
        error: 'Invalid PIN format',
        message: 'Transfer PIN must be exactly 4 digits'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { transferPin },
      { new: true }
    ).select('-password -securityAnswer');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    res.json({
      message: 'Transfer PIN updated successfully',
      user: {
        id: user._id,
        username: user.username,
        transferPin: user.transferPin
      }
    });

  } catch (error) {
    console.error('Set transfer PIN error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to set transfer PIN'
    });
  }
});

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    // Verify admin password
    const adminPassword = req.headers['x-admin-password'];
    if (!adminPassword || adminPassword.toString().trim() !== process.env.ADMIN_PASSWORD?.trim()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid admin password'
      });
    }

    const users = await User.find({}).select('-password -transferPin -securityAnswer');
    const accounts = await Account.find({});

    const usersWithAccounts = users.map(user => {
      const account = accounts.find(acc => acc.userId.toString() === (user._id as any).toString());
      return {
        ...user.toObject(),
        account: account ? {
          totalBalance: account.totalBalance,
          accountDistribution: account.accountDistribution
        } : null
      };
    });

    res.json({
      users: usersWithAccounts
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve users'
    });
  }
});

// ==================== CREDIT ALERT SYSTEM ====================

// POST /api/admin/credit-alert - Add money to user accounts
router.post('/credit-alert', async (req: Request, res: Response) => {
  try {
    // Verify admin password
    const adminPassword = req.headers['x-admin-password'];
    if (!adminPassword || adminPassword.toString().trim() !== process.env.ADMIN_PASSWORD?.trim()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid admin password'
      });
    }

    const { userId, accountType, amount, note } = req.body;

    // Validate required fields
    if (!userId || !accountType || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId, accountType, and amount are required'
      });
    }

    // Validate account type
    if (!['checking', 'savings', 'credit'].includes(accountType)) {
      return res.status(400).json({
        error: 'Invalid account type',
        message: 'accountType must be checking, savings, or credit'
      });
    }

    // Validate amount
    const creditAmount = parseFloat(amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }

    // Find user and account
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    const account = await Account.findOne({ userId });
    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'The user does not have an account'
      });
    }

    // Update account balance
    const oldBalance = account.accountDistribution[accountType as keyof typeof account.accountDistribution];
    const newBalance = oldBalance + creditAmount;
    
    // Update the specific account type
    account.accountDistribution[accountType as keyof typeof account.accountDistribution] = newBalance;
    
    // Recalculate total balance
    account.totalBalance = account.accountDistribution.checking + 
                          account.accountDistribution.savings + 
                          account.accountDistribution.credit;

    await account.save();

    // Create transaction record for the credit alert
    const transaction = new Transaction({
      userId: user._id,
      accountId: accountType,
      type: 'deposit',
      amount: creditAmount,
      description: `Credit Alert - ${note || 'Admin credit'}`,
      category: 'Credit Alert',
      status: 'completed',
      transactionDate: new Date(),
      metadata: {
        adminCredit: true,
        note: note || 'Admin credit alert',
        oldBalance: oldBalance,
        newBalance: newBalance
      }
    });

    await transaction.save();

    res.json({
      message: 'Credit alert processed successfully',
      creditAlert: {
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        accountType,
        amount: creditAmount,
        oldBalance,
        newBalance,
        note: note || 'Admin credit',
        transactionId: transaction._id,
        processedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Credit alert error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process credit alert'
    });
  }
});

// GET /api/admin/credit-history - Get credit alert history
router.get('/credit-history', async (req: Request, res: Response) => {
  try {
    // Verify admin password
    const adminPassword = req.headers['x-admin-password'];
    if (!adminPassword || adminPassword.toString().trim() !== process.env.ADMIN_PASSWORD?.trim()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid admin password'
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Find all credit alert transactions
    const transactions = await Transaction.find({
      'metadata.adminCredit': true
    })
    .populate('userId', 'firstName lastName username email')
    .sort({ transactionDate: -1 })
    .skip(skip)
    .limit(parseInt(limit as string));

    const total = await Transaction.countDocuments({
      'metadata.adminCredit': true
    });

    res.json({
      creditHistory: transactions,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalCount: total,
        hasNextPage: skip + transactions.length < total,
        hasPrevPage: parseInt(page as string) > 1
      }
    });

  } catch (error) {
    console.error('Credit history error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve credit history'
    });
  }
});

// POST /api/admin/debit-alert - Remove money from user accounts
router.post('/debit-alert', async (req: Request, res: Response) => {
  try {
    // Verify admin password
    const adminPassword = req.headers['x-admin-password'];
    if (!adminPassword || adminPassword.toString().trim() !== process.env.ADMIN_PASSWORD?.trim()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid admin password'
      });
    }

    const { userId, accountType, amount, note } = req.body;

    // Validate required fields
    if (!userId || !accountType || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId, accountType, and amount are required'
      });
    }

    // Validate account type
    if (!['checking', 'savings', 'credit'].includes(accountType)) {
      return res.status(400).json({
        error: 'Invalid account type',
        message: 'accountType must be checking, savings, or credit'
      });
    }

    // Validate amount
    const debitAmount = parseFloat(amount);
    if (isNaN(debitAmount) || debitAmount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }

    // Find user and account
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    const account = await Account.findOne({ userId });
    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'The user does not have an account'
      });
    }

    // Check if user has sufficient balance
    const currentBalance = account.accountDistribution[accountType as keyof typeof account.accountDistribution];
    if (currentBalance < debitAmount) {
      return res.status(400).json({
        error: 'Insufficient funds',
        message: `User only has $${currentBalance.toFixed(2)} in ${accountType} account`
      });
    }

    // Update account balance
    const newBalance = currentBalance - debitAmount;
    
    // Update the specific account type
    account.accountDistribution[accountType as keyof typeof account.accountDistribution] = newBalance;
    
    // Recalculate total balance
    account.totalBalance = account.accountDistribution.checking + 
                          account.accountDistribution.savings + 
                          account.accountDistribution.credit;

    await account.save();

    // Create transaction record for the debit alert
    const transaction = new Transaction({
      userId: user._id,
      accountId: accountType,
      type: 'withdrawal',
      amount: -debitAmount, // Negative amount for debit
      description: `Debit Alert - ${note || 'Admin debit'}`,
      category: 'Debit Alert',
      status: 'completed',
      transactionDate: new Date(),
      metadata: {
        adminDebit: true,
        note: note || 'Admin debit alert',
        oldBalance: currentBalance,
        newBalance: newBalance
      }
    });

    await transaction.save();

    res.json({
      message: 'Debit alert processed successfully',
      debitAlert: {
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        accountType,
        amount: debitAmount,
        oldBalance: currentBalance,
        newBalance: newBalance,
        note: note || 'Admin debit',
        transactionId: transaction._id,
        processedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Debit alert error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process debit alert'
    });
  }
});

// GET /api/admin/debit-history - Get debit alert history
router.get('/debit-history', async (req: Request, res: Response) => {
  try {
    // Verify admin password
    const adminPassword = req.headers['x-admin-password'];
    if (!adminPassword || adminPassword.toString().trim() !== process.env.ADMIN_PASSWORD?.trim()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid admin password'
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Find all debit alert transactions
    const transactions = await Transaction.find({
      'metadata.adminDebit': true
    })
    .populate('userId', 'firstName lastName username email')
    .sort({ transactionDate: -1 })
    .skip(skip)
    .limit(parseInt(limit as string));

    const total = await Transaction.countDocuments({
      'metadata.adminDebit': true
    });

    res.json({
      debitHistory: transactions,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalCount: total,
        hasNextPage: skip + transactions.length < total,
        hasPrevPage: parseInt(page as string) > 1
      }
    });

  } catch (error) {
    console.error('Debit history error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve debit history'
    });
  }
});

// PUT /api/admin/edit-user/:userId - Edit user information
router.put('/edit-user/:userId', async (req: Request, res: Response) => {
  try {
    // Verify admin password
    const adminPassword = req.headers['x-admin-password'];
    if (!adminPassword || adminPassword.toString().trim() !== process.env.ADMIN_PASSWORD?.trim()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid admin password'
      });
    }

    const { userId } = req.params;
    const { firstName, lastName, preferredDisplayName, address, phoneNumber, email, username } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !username) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'firstName, lastName, email, and username are required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with the specified ID does not exist'
      });
    }

    // Check if username is already taken by another user
    if (username !== user.username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          error: 'Username already exists',
          message: 'This username is already taken by another user'
        });
      }
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          error: 'Email already exists',
          message: 'This email is already taken by another user'
        });
      }
    }

    // Update user information
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        preferredDisplayName: preferredDisplayName || '',
        address: address || '',
        phoneNumber: phoneNumber || '',
        email,
        username
      },
      { new: true, runValidators: true }
    ).select('-password -transferPin -securityAnswer');

    res.json({
      message: 'User information updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Edit user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update user information'
    });
  }
});

// PUT /api/admin/reset-password/:userId - Reset user password (admin only)
router.put('/reset-password/:userId', async (req: Request, res: Response) => {
  try {
    // Verify admin password
    const adminPassword = req.headers['x-admin-password'];
    if (!adminPassword || adminPassword.toString().trim() !== process.env.ADMIN_PASSWORD?.trim()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid admin password'
      });
    }

    const { userId } = req.params;
    const { newPassword } = req.body;

    // Validate required fields
    if (!newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'newPassword is required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with the specified ID does not exist'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password reset successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to reset password'
    });
  }
});

export default router;



