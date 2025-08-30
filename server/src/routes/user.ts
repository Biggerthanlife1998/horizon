import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User';
import Account from '../models/Account';
import Transaction from '../models/Transaction';
import Card from '../models/Card';
import SavedRecipient from '../models/SavedRecipient';
import ScheduledTransfer from '../models/ScheduledTransfer';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Configure multer for profile picture uploads
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

// GET /api/user/profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('-password -transferPin -securityAnswer');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        preferredDisplayName: user.preferredDisplayName,
        address: user.address,
        phoneNumber: user.phoneNumber,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        isAdmin: user.isAdmin,
        securityQuestion: user.securityQuestion,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user profile'
    });
  }
});

// PUT /api/user/profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, preferredDisplayName, address, phoneNumber, email } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !preferredDisplayName || !address || !phoneNumber || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'All fields are required'
      });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.user._id } 
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Email already exists',
        message: 'This email is already in use by another user'
      });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        firstName,
        lastName,
        preferredDisplayName,
        address,
        phoneNumber,
        email
      },
      { new: true }
    ).select('-password -transferPin -securityAnswer');

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        preferredDisplayName: updatedUser.preferredDisplayName,
        address: updatedUser.address,
        phoneNumber: updatedUser.phoneNumber,
        email: updatedUser.email,
        username: updatedUser.username,
        profilePicture: updatedUser.profilePicture,
        isAdmin: updatedUser.isAdmin,
        securityQuestion: updatedUser.securityQuestion,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update user profile'
    });
  }
});

// PUT /api/user/password
router.put('/password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing passwords',
        message: 'Current password and new password are required'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Verify current password
    if (user.password !== currentPassword) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to change password'
    });
  }
});

// PUT /api/user/transfer-pin
router.put('/transfer-pin', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { currentPin, newPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({
        error: 'Missing PINs',
        message: 'Current PIN and new PIN are required'
      });
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return res.status(400).json({
        error: 'Invalid PIN format',
        message: 'PIN must be exactly 4 digits'
      });
    }

    // Get user with transfer PIN
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Verify current PIN
    if (user.transferPin !== currentPin) {
      return res.status(400).json({
        error: 'Invalid PIN',
        message: 'Current PIN is incorrect'
      });
    }

    // Update transfer PIN
    user.transferPin = newPin;
    await user.save();

    res.json({
      message: 'Transfer PIN updated successfully'
    });

  } catch (error) {
    console.error('Change transfer PIN error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to change transfer PIN'
    });
  }
});

// GET /api/user/accounts
router.get('/accounts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const account = await Account.findOne({ userId: req.user._id });
    
    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'User account not found'
      });
    }

    // Generate consistent account numbers based on user ID
    const userIdHash = req.user._id.toString().slice(-8);
    const checkingNumber = `****${parseInt(userIdHash, 16) % 9000 + 1000}`;
    const savingsNumber = `****${(parseInt(userIdHash, 16) + 1000) % 9000 + 1000}`;
    const creditNumber = `****${(parseInt(userIdHash, 16) + 2000) % 9000 + 1000}`;

    // Format accounts for frontend consumption
    const accounts = [
      {
        id: 'checking',
        type: 'checking',
        name: 'Checking Account',
        balance: account.accountDistribution.checking,
        availableBalance: account.accountDistribution.checking,
        accountNumber: checkingNumber,
        routingNumber: '123456789',
        status: 'active'
      },
      {
        id: 'savings',
        type: 'savings',
        name: 'Savings Account',
        balance: account.accountDistribution.savings,
        availableBalance: account.accountDistribution.savings,
        accountNumber: savingsNumber,
        routingNumber: '123456789',
        status: 'active'
      }
    ];

    // Add credit card account if credit limit exists
    if (account.accountDistribution.credit && account.accountDistribution.credit > 0) {
      accounts.push({
        id: 'credit',
        type: 'credit',
        name: 'Credit Card',
        balance: account.accountDistribution.credit,
        availableBalance: 0, // Credit cards don't have available balance
        accountNumber: creditNumber,
        routingNumber: 'N/A',
        status: 'active'
      });
    }

    res.json({
      accounts,
      totalBalance: account.totalBalance,
      accountDistribution: account.accountDistribution,
      creationDate: account.creationDate
    });

  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve account information'
    });
  }
});

// GET /api/user/statements
router.get('/statements', authenticateToken, async (req: Request, res: Response) => {
  try {
    const account = await Account.findOne({ userId: req.user._id });
    const user = await User.findById(req.user._id).select('firstName lastName email username');
    
    if (!account || !user) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'User account not found'
      });
    }

    // Generate statement period (current month)
    const now = new Date();
    const statementPeriod = {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };

    // Return comprehensive data for client-side PDF generation
    res.json({
      statement: {
        user: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          username: user.username
        },
        account: {
          totalBalance: account.totalBalance,
          accountDistribution: account.accountDistribution,
          creationDate: account.creationDate,
          accountNumbers: {
            checking: `****${parseInt(req.user._id.toString().slice(-8), 16) % 9000 + 1000}`,
            savings: `****${(parseInt(req.user._id.toString().slice(-8), 16) + 1000) % 9000 + 1000}`,
            credit: account.accountDistribution.credit > 0 ? 
              `****${(parseInt(req.user._id.toString().slice(-8), 16) + 2000) % 9000 + 1000}` : undefined
          }
        },
        statementPeriod,
        generatedAt: new Date().toISOString(),
        bankInfo: {
          name: 'Navy Federal Credit Union',
          address: '820 Fayetteville St, Raleigh, NC 27601',
          phone: '1-800-NAVY-FED',
          website: 'www.navyfederal.org'
        }
      }
    });

  } catch (error) {
    console.error('Get statements error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve statement data'
    });
  }
});

// GET /api/user/accounts/:type
router.get('/accounts/:type', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    if (!['checking', 'savings', 'credit'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid account type',
        message: 'Account type must be "checking", "savings", or "credit"'
      });
    }

    const account = await Account.findOne({ userId: req.user._id });
    
    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'User account not found'
      });
    }

    // Generate consistent account number based on user ID
    const userIdHash = req.user._id.toString().slice(-8);
    let accountNumber;
    if (type === 'checking') {
      accountNumber = `****${parseInt(userIdHash, 16) % 9000 + 1000}`;
    } else if (type === 'savings') {
      accountNumber = `****${(parseInt(userIdHash, 16) + 1000) % 9000 + 1000}`;
    } else {
      accountNumber = `****${(parseInt(userIdHash, 16) + 2000) % 9000 + 1000}`;
    }

    const accountData = {
      id: type,
      type,
      name: type === 'checking' ? 'Checking Account' : 
            type === 'savings' ? 'Savings Account' : 'Credit Card',
      balance: account.accountDistribution[type as keyof typeof account.accountDistribution],
      availableBalance: type === 'credit' ? 0 : account.accountDistribution[type as keyof typeof account.accountDistribution],
      accountNumber: accountNumber,
      routingNumber: type === 'credit' ? 'N/A' : '123456789',
      status: 'active',
      creationDate: account.creationDate
    };

    res.json({ account: accountData });

  } catch (error) {
    console.error('Get account by type error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve account information'
    });
  }
});

// GET /api/user/accounts/:type/transactions
router.get('/accounts/:type/transactions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 25, startDate, endDate } = req.query;
    
    if (!['checking', 'savings', 'credit'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid account type',
        message: 'Account type must be "checking", "savings", or "credit"'
      });
    }

    // Build query
    const query: any = { 
      userId: req.user._id,
      accountId: type
    };

    // Add date filters if provided
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.transactionDate.$lte = new Date(endDate as string);
      }
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get transactions with pagination
    const transactions = await Transaction.find(query)
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalCount / Number(limit));

    // Format transactions for frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      accountId: tx.accountId,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      status: tx.status,
      transactionDate: tx.transactionDate,
      createdAt: tx.createdAt
    }));

    res.json({
      transactions: formattedTransactions,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalCount,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      }
    });

  } catch (error) {
    console.error('Get account transactions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve account transactions'
    });
  }
});

// GET /api/user/transactions/recent
router.get('/transactions/recent', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Get 25 most recent transactions
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(25)
      .lean();

    // Format transactions for frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      accountId: tx.accountId,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      status: tx.status,
      transactionDate: tx.transactionDate,
      createdAt: tx.createdAt
    }));

    res.json({
      transactions: formattedTransactions
    });

  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve recent transactions'
    });
  }
});

// GET /api/user/transactions
router.get('/transactions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { 
      accountId, 
      type, 
      startDate, 
      endDate, 
      limit = 50, 
      page = 1 
    } = req.query;

    // Build query
    const query: any = { userId: req.user._id };
    
    if (accountId && accountId !== 'all') {
      query.accountId = accountId;
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.transactionDate.$lte = new Date(endDate as string);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    // Get transactions with pagination
    const transactions = await Transaction.find(query)
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .lean();

    // Get total count for pagination
    const totalCount = await Transaction.countDocuments(query);

    // Format transactions for frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      accountId: tx.accountId,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      status: tx.status,
      transactionDate: tx.transactionDate,
      createdAt: tx.createdAt
    }));

    res.json({
      transactions: formattedTransactions,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(totalCount / parseInt(limit as string)),
        totalCount,
        hasNextPage: skip + transactions.length < totalCount,
        hasPrevPage: parseInt(page as string) > 1
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve transactions'
    });
  }
});

// POST /api/user/transfer
router.post('/transfer', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      fromAccountId,
      recipientName,
      recipientAccountNumber,
      recipientBankName,
      amount,
      note,
      kind,
      swiftCode,
      transferPin,
      transferSpeed,
      saveRecipient
    } = req.body;

    // Validate required fields
    if (!fromAccountId || !recipientName || !recipientAccountNumber || !amount || !kind || !transferPin) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'All required fields must be provided'
      });
    }

    // Validate amount
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }

    // Get user and validate transfer PIN
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    if (user.transferPin !== transferPin) {
      return res.status(401).json({
        error: 'Invalid transfer PIN',
        message: 'Transfer PIN is incorrect'
      });
    }

    // Get source account
    const sourceAccount = await Account.findOne({ userId: req.user._id });
    if (!sourceAccount) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'Source account not found'
      });
    }

    // Validate account type (no transfers from credit cards)
    if (fromAccountId === 'credit') {
      return res.status(400).json({
        error: 'Invalid account type',
        message: 'Cannot transfer from credit card accounts'
      });
    }

    // Check sufficient balance
    const availableBalance = sourceAccount.accountDistribution.checking + sourceAccount.accountDistribution.savings;
    if (transferAmount > availableBalance) {
      return res.status(400).json({
        error: 'Insufficient funds',
        message: 'Insufficient balance for transfer'
      });
    }

    // Generate confirmation code
    const confirmationCode = 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Create transfer transaction
    const transferTransaction = new Transaction({
      userId: req.user._id,
      accountId: fromAccountId,
      type: 'transfer',
      amount: -transferAmount, // Negative for outgoing
      description: `Transfer to ${recipientName} (${recipientAccountNumber})${recipientBankName ? ` - ${recipientBankName}` : ''}`,
      category: 'Transfer',
      status: 'completed',
      transactionDate: new Date(),
      metadata: {
        recipientName,
        recipientAccountNumber,
        recipientBankName,
        note,
        kind,
        swiftCode,
        transferSpeed,
        confirmationCode
      }
    });

    await transferTransaction.save();

    // Save recipient if requested
    if (saveRecipient) {
      try {
        // Check if recipient already exists
        const existingRecipient = await SavedRecipient.findOne({
          userId: req.user._id,
          accountNumber: recipientAccountNumber.trim()
        });

        if (!existingRecipient) {
          // Create new saved recipient
          const newRecipient = new SavedRecipient({
            userId: req.user._id,
            name: recipientName.trim(),
            accountNumber: recipientAccountNumber.trim(),
            bankName: recipientBankName?.trim(),
            category: 'other',
            isVerified: false,
            lastUsed: new Date()
          });
          await newRecipient.save();
        } else {
          // Update lastUsed for existing recipient
          existingRecipient.lastUsed = new Date();
          await existingRecipient.save();
        }
      } catch (recipientError) {
        // Don't fail the transfer if saving recipient fails
        console.error('Error saving recipient:', recipientError);
      }
    }

    // Update account balance (deduct from source)
    if (sourceAccount.accountDistribution.checking >= transferAmount) {
      sourceAccount.accountDistribution.checking -= transferAmount;
    } else {
      // Deduct from savings if checking is insufficient
      const remainingFromChecking = sourceAccount.accountDistribution.checking;
      sourceAccount.accountDistribution.checking = 0;
      sourceAccount.accountDistribution.savings -= (transferAmount - remainingFromChecking);
    }

    sourceAccount.totalBalance = sourceAccount.accountDistribution.checking + sourceAccount.accountDistribution.savings;
    await sourceAccount.save();

    // Generate receipt data
    const receipt = {
      confirmationCode,
      amount: transferAmount,
      fromAccount: sourceAccount._id,
      fromAccountType: fromAccountId,
      toName: recipientName,
      toAccountNumber: recipientAccountNumber,
      toBankName: recipientBankName,
      swiftCode: kind === 'international' ? swiftCode : undefined,
      dateTime: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      note: note || ''
    };

    res.json({
      success: true,
      message: 'Transfer completed successfully',
      receipt,
      transaction: transferTransaction
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process transfer'
    });
  }
});

// GET /api/user/transfer/history - Comprehensive transaction history across all accounts
router.get('/transfer/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, accountType, transactionType } = req.query;
    
    // Build query
    const query: any = { 
      userId: req.user._id
    };

    // Add account type filter if provided
    if (accountType && ['checking', 'savings', 'credit'].includes(accountType as string)) {
      query.accountId = accountType;
    }

    // Add transaction type filter if provided
    if (transactionType) {
      query.type = transactionType;
    }

    // Add date filters if provided
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.transactionDate.$lte = new Date(endDate as string);
      }
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get transactions with pagination
    const transactions = await Transaction.find(query)
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalCount / Number(limit));

    // Get account summary for context
    const account = await Account.findOne({ userId: req.user._id });
    
    // Format transactions for frontend with additional context
    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      accountId: tx.accountId,
      accountName: tx.accountId === 'checking' ? 'Checking Account' : 
                   tx.accountId === 'savings' ? 'Savings Account' : 'Credit Card',
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      status: tx.status,
      transactionDate: tx.transactionDate,
      createdAt: tx.createdAt,
      // Add account balance context
      accountBalance: account ? account.accountDistribution[tx.accountId as keyof typeof account.accountDistribution] : 0
    }));

    // Calculate summary statistics
    const summary = {
      totalTransactions: totalCount,
      totalAmount: transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
      checkingTransactions: transactions.filter(tx => tx.accountId === 'checking').length,
      savingsTransactions: transactions.filter(tx => tx.accountId === 'savings').length,
      creditTransactions: transactions.filter(tx => tx.accountId === 'credit').length,
      accountBalances: account ? {
        checking: account.accountDistribution.checking,
        savings: account.accountDistribution.savings,
        credit: account.accountDistribution.credit
      } : null
    };

    res.json({
      transactions: formattedTransactions,
      summary,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalCount,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      }
    });

  } catch (error) {
    console.error('Get transfer history error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve transfer history'
    });
  }
});

// GET /api/user/payments/billers - Get available billers
router.get('/payments/billers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const billers = [
      {
        id: 'electricity',
        name: 'City Power & Light',
        category: 'Utilities',
        description: 'Electricity bill payment',
        accountNumber: 'ELC-****-1234'
      },
      {
        id: 'internet',
        name: 'Broadband Solutions',
        category: 'Internet',
        description: 'Internet service payment',
        accountNumber: 'INT-****-5678'
      },
      {
        id: 'phone',
        name: 'Mobile Communications',
        category: 'Phone',
        description: 'Mobile phone bill payment',
        accountNumber: 'PHN-****-9012'
      },
      {
        id: 'water',
        name: 'Municipal Water Authority',
        category: 'Utilities',
        description: 'Water bill payment',
        accountNumber: 'WTR-****-3456'
      },
      {
        id: 'insurance',
        name: 'Home Insurance Co.',
        category: 'Insurance',
        description: 'Home insurance premium',
        accountNumber: 'INS-****-7890'
      },
      {
        id: 'cable',
        name: 'StreamTV Services',
        category: 'Entertainment',
        description: 'Cable TV subscription',
        accountNumber: 'CBL-****-2468'
      }
    ];

    res.json({ billers });

  } catch (error) {
    console.error('Get billers error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve billers'
    });
  }
});

// POST /api/user/payments - Process bill payment
router.post('/payments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { billerId, amount, note } = req.body;

    // Validate required fields
    if (!billerId || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Biller and amount are required'
      });
    }

    // Validate amount
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }

    // Get user account
    const account = await Account.findOne({ userId: req.user._id });
    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'User account not found'
      });
    }

    // Check sufficient balance in checking account
    if (paymentAmount > account.accountDistribution.checking) {
      return res.status(400).json({
        error: 'Insufficient funds',
        message: 'Insufficient balance in checking account for payment'
      });
    }

    // Get biller information
    const billers = [
      { id: 'electricity', name: 'City Power & Light' },
      { id: 'internet', name: 'Broadband Solutions' },
      { id: 'phone', name: 'Mobile Communications' },
      { id: 'water', name: 'Municipal Water Authority' },
      { id: 'insurance', name: 'Home Insurance Co.' },
      { id: 'cable', name: 'StreamTV Services' }
    ];

    const biller = billers.find(b => b.id === billerId);
    if (!biller) {
      return res.status(400).json({
        error: 'Invalid biller',
        message: 'Selected biller is not valid'
      });
    }

    // Generate confirmation code
    const confirmationCode = 'PAY' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Create payment transaction
    const paymentTransaction = new Transaction({
      userId: req.user._id,
      accountId: 'checking',
      type: 'payment',
      amount: -paymentAmount, // Negative for outgoing payment
      description: `Bill Payment - ${biller.name}`,
      category: 'Bill Payment',
      status: 'completed',
      transactionDate: new Date(),
      metadata: {
        billerId,
        billerName: biller.name,
        note,
        confirmationCode
      }
    });

    await paymentTransaction.save();

    // Update account balance (deduct from checking)
    account.accountDistribution.checking -= paymentAmount;
    account.totalBalance = account.accountDistribution.checking + account.accountDistribution.savings;
    await account.save();

    // Generate receipt data
    const receipt = {
      confirmationCode,
      amount: paymentAmount,
      billerName: biller.name,
      billerId,
      accountNumber: `****${parseInt(req.user._id.toString().slice(-8), 16) % 9000 + 1000}`,
      dateTime: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      note: note || ''
    };

    res.json({
      success: true,
      message: 'Payment completed successfully',
      receipt,
      transaction: paymentTransaction
    });

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process payment'
    });
  }
});

// GET /api/user/payments/history - Get payment history
router.get('/payments/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 25, startDate, endDate, billerId } = req.query;

    // Build query for payment transactions
    const query: any = { 
      userId: req.user._id,
      type: 'payment'
    };

    // Add biller filter if provided
    if (billerId) {
      query['metadata.billerId'] = billerId;
    }

    // Add date filters if provided
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.transactionDate.$lte = new Date(endDate as string);
      }
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get payment transactions with pagination
    const transactions = await Transaction.find(query)
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalCount / Number(limit));

    // Format transactions for frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      status: tx.status,
      transactionDate: tx.transactionDate,
      createdAt: tx.createdAt,
      billerName: tx.metadata?.billerName || 'Unknown Biller',
      billerId: tx.metadata?.billerId,
      confirmationCode: tx.metadata?.confirmationCode,
      note: tx.metadata?.note
    }));

    res.json({
      payments: formattedTransactions,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalCount,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve payment history'
    });
  }
});

// ==================== CARD SERVICES ====================

// GET /api/user/cards - Get all user's cards
router.get('/cards', authenticateToken, async (req: Request, res: Response) => {
  try {
    const cards = await Card.find({ userId: req.user._id }).select('-number'); // Don't return full card number
    
    // Update card balances from account data
    const account = await Account.findOne({ userId: req.user._id });
    if (account) {
      for (const card of cards) {
        if (card.type === 'debit' && card.accountId === 'checking') {
          card.currentBalance = account.accountDistribution.checking;
        } else if (card.type === 'credit' && card.accountId === 'credit') {
          // For credit cards, currentBalance is the debt amount
          const creditTransactions = await Transaction.find({
            userId: req.user._id,
            accountId: 'credit',
            type: { $in: ['withdrawal', 'grocery', 'gas', 'restaurant', 'online', 'atm', 'fee'] }
          });
          
          const totalDebt = creditTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
          card.currentBalance = totalDebt;
          card.availableCredit = (card.creditLimit || 0) - totalDebt;
        }
      }
    }
    
    res.json({ cards });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// PUT /api/user/cards/:cardId/block - Block a card
router.put('/cards/:cardId/block', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    
    const card = await Card.findOneAndUpdate(
      { _id: cardId, userId: req.user._id },
      { isBlocked: true },
      { new: true }
    ).select('-number');
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    res.json({ 
      message: 'Card blocked successfully',
      card 
    });
  } catch (error) {
    console.error('Error blocking card:', error);
    res.status(500).json({ error: 'Failed to block card' });
  }
});

// PUT /api/user/cards/:cardId/unblock - Unblock a card
router.put('/cards/:cardId/unblock', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    
    const card = await Card.findOneAndUpdate(
      { _id: cardId, userId: req.user._id },
      { isBlocked: false },
      { new: true }
    ).select('-number');
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    res.json({ 
      message: 'Card unblocked successfully',
      card 
    });
  } catch (error) {
    console.error('Error unblocking card:', error);
    res.status(500).json({ error: 'Failed to unblock card' });
  }
});

// PUT /api/user/cards/:cardId/limit - Update daily limit
router.put('/cards/:cardId/limit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    const { dailyLimit } = req.body;
    
    if (!dailyLimit || dailyLimit <= 0) {
      return res.status(400).json({ error: 'Daily limit must be greater than 0' });
    }
    
    const card = await Card.findOneAndUpdate(
      { _id: cardId, userId: req.user._id },
      { dailyLimit: parseFloat(dailyLimit) },
      { new: true }
    ).select('-number');
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    res.json({ 
      message: 'Daily limit updated successfully',
      card 
    });
  } catch (error) {
    console.error('Error updating daily limit:', error);
    res.status(500).json({ error: 'Failed to update daily limit' });
  }
});

// ==================== SAVED RECIPIENTS ENDPOINTS ====================

// GET /api/user/recipients - Get user's saved recipients
router.get('/recipients', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const recipients = await SavedRecipient.find({ userId })
      .sort({ lastUsed: -1, createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      recipients: recipients.map(recipient => ({
        id: recipient._id,
        name: recipient.name,
        accountNumber: recipient.accountNumber,
        bankName: recipient.bankName,
        category: recipient.category,
        isVerified: recipient.isVerified,
        lastUsed: recipient.lastUsed,
        createdAt: recipient.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ error: 'Failed to fetch recipients' });
  }
});

// POST /api/user/recipients - Save a new recipient
router.post('/recipients', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, accountNumber, bankName, category } = req.body;

    // Validate required fields
    if (!name || !accountNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name and account number are required'
      });
    }

    // Check if recipient already exists for this user
    const existingRecipient = await SavedRecipient.findOne({
      userId,
      accountNumber: accountNumber.trim()
    });

    if (existingRecipient) {
      return res.status(409).json({
        error: 'Recipient already exists',
        message: 'This recipient is already saved in your list'
      });
    }

    // Create new recipient
    const recipient = new SavedRecipient({
      userId,
      name: name.trim(),
      accountNumber: accountNumber.trim(),
      bankName: bankName?.trim(),
      category: category || 'other',
      isVerified: false,
      lastUsed: new Date()
    });

    await recipient.save();

    res.status(201).json({
      success: true,
      message: 'Recipient saved successfully',
      recipient: {
        id: recipient._id,
        name: recipient.name,
        accountNumber: recipient.accountNumber,
        bankName: recipient.bankName,
        category: recipient.category,
        isVerified: recipient.isVerified,
        lastUsed: recipient.lastUsed,
        createdAt: recipient.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving recipient:', error);
    res.status(500).json({ error: 'Failed to save recipient' });
  }
});

// PUT /api/user/recipients/:id - Update a saved recipient
router.put('/recipients/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const { name, accountNumber, bankName, category } = req.body;

    // Validate required fields
    if (!name || !accountNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name and account number are required'
      });
    }

    // Find recipient and verify ownership
    const recipient = await SavedRecipient.findOne({ _id: id, userId });
    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found',
        message: 'Recipient not found or you do not have permission to edit it'
      });
    }

    // Check if new account number conflicts with existing recipients
    if (accountNumber.trim() !== recipient.accountNumber) {
      const existingRecipient = await SavedRecipient.findOne({
        userId,
        accountNumber: accountNumber.trim(),
        _id: { $ne: id }
      });

      if (existingRecipient) {
        return res.status(409).json({
          error: 'Account number already exists',
          message: 'This account number is already saved in your list'
        });
      }
    }

    // Update recipient
    recipient.name = name.trim();
    recipient.accountNumber = accountNumber.trim();
    recipient.bankName = bankName?.trim();
    recipient.category = category || recipient.category;
    recipient.updatedAt = new Date();

    await recipient.save();

    res.json({
      success: true,
      message: 'Recipient updated successfully',
      recipient: {
        id: recipient._id,
        name: recipient.name,
        accountNumber: recipient.accountNumber,
        bankName: recipient.bankName,
        category: recipient.category,
        isVerified: recipient.isVerified,
        lastUsed: recipient.lastUsed,
        createdAt: recipient.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating recipient:', error);
    res.status(500).json({ error: 'Failed to update recipient' });
  }
});

// DELETE /api/user/recipients/:id - Delete a saved recipient
router.delete('/recipients/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    // Find and delete recipient
    const recipient = await SavedRecipient.findOneAndDelete({ _id: id, userId });
    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found',
        message: 'Recipient not found or you do not have permission to delete it'
      });
    }

    res.json({
      success: true,
      message: 'Recipient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recipient:', error);
    res.status(500).json({ error: 'Failed to delete recipient' });
  }
});

// POST /api/user/recipients/:id/use - Mark recipient as used (update lastUsed)
router.post('/recipients/:id/use', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    // Find recipient and verify ownership
    const recipient = await SavedRecipient.findOne({ _id: id, userId });
    if (!recipient) {
      return res.status(404).json({
        error: 'Recipient not found',
        message: 'Recipient not found or you do not have permission to access it'
      });
    }

    // Update lastUsed timestamp
    recipient.lastUsed = new Date();
    await recipient.save();

    res.json({
      success: true,
      message: 'Recipient usage updated',
      recipient: {
        id: recipient._id,
        name: recipient.name,
        accountNumber: recipient.accountNumber,
        bankName: recipient.bankName,
        category: recipient.category,
        isVerified: recipient.isVerified,
        lastUsed: recipient.lastUsed,
        createdAt: recipient.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating recipient usage:', error);
    res.status(500).json({ error: 'Failed to update recipient usage' });
  }
});

// ==================== SCHEDULED TRANSFERS ENDPOINTS ====================

// GET /api/user/scheduled-transfers - Get user's scheduled transfers
router.get('/scheduled-transfers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { status, limit = 50 } = req.query;
    
    let query: any = { userId };
    if (status) {
      query.status = status;
    }

    const scheduledTransfers = await ScheduledTransfer.find(query)
      .sort({ scheduledDate: 1 })
      .limit(parseInt(limit as string))
      .select('-__v');

    res.json({
      success: true,
      scheduledTransfers: scheduledTransfers.map(transfer => ({
        id: transfer._id,
        fromAccountId: transfer.fromAccountId,
        recipientName: transfer.recipientName,
        recipientAccountNumber: transfer.recipientAccountNumber,
        recipientBankName: transfer.recipientBankName,
        amount: transfer.amount,
        note: transfer.note,
        kind: transfer.kind,
        swiftCode: transfer.swiftCode,
        transferSpeed: transfer.transferSpeed,
        scheduledDate: transfer.scheduledDate,
        status: transfer.status,
        frequency: transfer.frequency,
        endDate: transfer.endDate,
        lastExecuted: transfer.lastExecuted,
        nextExecution: transfer.nextExecution,
        executionCount: transfer.executionCount,
        maxExecutions: transfer.maxExecutions,
        confirmationCode: transfer.confirmationCode,
        createdAt: transfer.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching scheduled transfers:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled transfers' });
  }
});

// POST /api/user/scheduled-transfers - Create a new scheduled transfer
router.post('/scheduled-transfers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      fromAccountId,
      recipientName,
      recipientAccountNumber,
      recipientBankName,
      amount,
      note,
      kind,
      swiftCode,
      transferSpeed,
      scheduledDate,
      frequency = 'once',
      endDate,
      maxExecutions
    } = req.body;

    // Validate required fields
    if (!fromAccountId || !recipientName || !recipientAccountNumber || !amount || !scheduledDate) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'All required fields must be provided'
      });
    }

    // Validate amount
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }

    // Validate scheduled date (must be in the future)
    const scheduledDateTime = new Date(scheduledDate);
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({
        error: 'Invalid scheduled date',
        message: 'Scheduled date must be in the future'
      });
    }

    // Get user's account to validate fromAccountId
    const account = await Account.findOne({ userId });
    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'User account not found'
      });
    }

    // Validate fromAccountId exists in user's account distribution
    if (!account.accountDistribution[fromAccountId as keyof typeof account.accountDistribution]) {
      return res.status(400).json({
        error: 'Invalid account',
        message: 'Source account not found'
      });
    }

    // Calculate next execution date
    let nextExecution = scheduledDateTime;
    if (frequency !== 'once') {
      nextExecution = calculateNextExecution(scheduledDateTime, frequency);
    }

    // Generate confirmation code
    const confirmationCode = 'SCH' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Create scheduled transfer
    const scheduledTransfer = new ScheduledTransfer({
      userId,
      fromAccountId,
      recipientName: recipientName.trim(),
      recipientAccountNumber: recipientAccountNumber.trim(),
      recipientBankName: recipientBankName?.trim(),
      amount: transferAmount,
      note: note?.trim(),
      kind: kind || 'internal',
      swiftCode: kind === 'international' ? swiftCode?.trim() : undefined,
      transferSpeed: transferSpeed || 'next-day',
      scheduledDate: scheduledDateTime,
      frequency,
      endDate: endDate ? new Date(endDate) : undefined,
      nextExecution,
      maxExecutions: maxExecutions ? parseInt(maxExecutions) : undefined,
      confirmationCode
    });

    await scheduledTransfer.save();

    res.status(201).json({
      success: true,
      message: 'Scheduled transfer created successfully',
      scheduledTransfer: {
        id: scheduledTransfer._id,
        fromAccountId: scheduledTransfer.fromAccountId,
        recipientName: scheduledTransfer.recipientName,
        recipientAccountNumber: scheduledTransfer.recipientAccountNumber,
        recipientBankName: scheduledTransfer.recipientBankName,
        amount: scheduledTransfer.amount,
        note: scheduledTransfer.note,
        kind: scheduledTransfer.kind,
        swiftCode: scheduledTransfer.swiftCode,
        transferSpeed: scheduledTransfer.transferSpeed,
        scheduledDate: scheduledTransfer.scheduledDate,
        status: scheduledTransfer.status,
        frequency: scheduledTransfer.frequency,
        endDate: scheduledTransfer.endDate,
        nextExecution: scheduledTransfer.nextExecution,
        executionCount: scheduledTransfer.executionCount,
        maxExecutions: scheduledTransfer.maxExecutions,
        confirmationCode: scheduledTransfer.confirmationCode,
        createdAt: scheduledTransfer.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating scheduled transfer:', error);
    res.status(500).json({ error: 'Failed to create scheduled transfer' });
  }
});

// PUT /api/user/scheduled-transfers/:id - Update a scheduled transfer
router.put('/scheduled-transfers/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Find scheduled transfer and verify ownership
    const scheduledTransfer = await ScheduledTransfer.findOne({ _id: id, userId });
    if (!scheduledTransfer) {
      return res.status(404).json({
        error: 'Scheduled transfer not found',
        message: 'Scheduled transfer not found or you do not have permission to edit it'
      });
    }

    // Don't allow editing if already processing or completed
    if (['processing', 'completed'].includes(scheduledTransfer.status)) {
      return res.status(400).json({
        error: 'Cannot edit transfer',
        message: 'Cannot edit transfers that are processing or completed'
      });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id' && key !== 'userId') {
        (scheduledTransfer as any)[key] = updateData[key];
      }
    });

    // Recalculate next execution if frequency or scheduled date changed
    if (updateData.frequency || updateData.scheduledDate) {
      const scheduledDate = updateData.scheduledDate ? new Date(updateData.scheduledDate) : scheduledTransfer.scheduledDate;
      const frequency = updateData.frequency || scheduledTransfer.frequency;
      
      if (frequency !== 'once') {
        scheduledTransfer.nextExecution = calculateNextExecution(scheduledDate, frequency);
      } else {
        scheduledTransfer.nextExecution = scheduledDate;
      }
    }

    await scheduledTransfer.save();

    res.json({
      success: true,
      message: 'Scheduled transfer updated successfully',
      scheduledTransfer: {
        id: scheduledTransfer._id,
        fromAccountId: scheduledTransfer.fromAccountId,
        recipientName: scheduledTransfer.recipientName,
        recipientAccountNumber: scheduledTransfer.recipientAccountNumber,
        recipientBankName: scheduledTransfer.recipientBankName,
        amount: scheduledTransfer.amount,
        note: scheduledTransfer.note,
        kind: scheduledTransfer.kind,
        swiftCode: scheduledTransfer.swiftCode,
        transferSpeed: scheduledTransfer.transferSpeed,
        scheduledDate: scheduledTransfer.scheduledDate,
        status: scheduledTransfer.status,
        frequency: scheduledTransfer.frequency,
        endDate: scheduledTransfer.endDate,
        nextExecution: scheduledTransfer.nextExecution,
        executionCount: scheduledTransfer.executionCount,
        maxExecutions: scheduledTransfer.maxExecutions,
        confirmationCode: scheduledTransfer.confirmationCode,
        createdAt: scheduledTransfer.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating scheduled transfer:', error);
    res.status(500).json({ error: 'Failed to update scheduled transfer' });
  }
});

// DELETE /api/user/scheduled-transfers/:id - Cancel a scheduled transfer
router.delete('/scheduled-transfers/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    // Find scheduled transfer and verify ownership
    const scheduledTransfer = await ScheduledTransfer.findOne({ _id: id, userId });
    if (!scheduledTransfer) {
      return res.status(404).json({
        error: 'Scheduled transfer not found',
        message: 'Scheduled transfer not found or you do not have permission to delete it'
      });
    }

    // Don't allow deleting if already processing or completed
    if (['processing', 'completed'].includes(scheduledTransfer.status)) {
      return res.status(400).json({
        error: 'Cannot delete transfer',
        message: 'Cannot delete transfers that are processing or completed'
      });
    }

    // Cancel the scheduled transfer
    scheduledTransfer.status = 'cancelled';
    await scheduledTransfer.save();

    res.json({
      success: true,
      message: 'Scheduled transfer cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling scheduled transfer:', error);
    res.status(500).json({ error: 'Failed to cancel scheduled transfer' });
  }
});

// Helper function to calculate next execution date
function calculateNextExecution(currentDate: Date, frequency: string): Date {
  const next = new Date(currentDate);
  
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      return currentDate;
  }
  
  return next;
}

export default router;



