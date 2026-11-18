import User from '../models/User.js';
import Company from '../models/Company.js';
import jwt from 'jsonwebtoken';

const generateAccessToken = (id, role, companyId) => {
  return jwt.sign(
    { id, role, companyId },
    process.env.JWT_SECRET || 'talentflow_access_secret_key_998877',
    { expiresIn: '1d' } // 1 day access token
  );
};

const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET || 'talentflow_refresh_secret_key_112233',
    { expiresIn: '7d' } // 7 days refresh token
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, companyName, industry, website } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields (name, email, password, role)' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let companyId = null;

    // SaaS Flow: If COMPANY_ADMIN, create a company profile first
    if (role === 'COMPANY_ADMIN') {
      if (!companyName) {
        return res.status(400).json({ message: 'Company name is required for Company Admin registration' });
      }

      const company = await Company.create({
        companyName,
        industry: industry || '',
        website: website || '',
        recruitersCount: 1, // The creator is the first user
      });
      companyId = company._id;
    } else if (role === 'RECRUITER' || role === 'INTERVIEWER') {
      // If a recruiter or interviewer tries to sign up manually, they need a companyId.
      // Otherwise, the company admin can create them, or they pass the ID.
      companyId = req.body.companyId || null;
    }

    // Create User
    const user = await User.create({
      name,
      email,
      password, // Will be hashed pre-save
      role,
      companyId,
      avatar: req.body.avatar || '',
    });

    if (user) {
      const accessToken = generateAccessToken(user._id, user.role, user.companyId);
      const refreshToken = generateRefreshToken(user._id);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        avatar: user.avatar,
        accessToken,
        refreshToken,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Authenticate user & get tokens
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const accessToken = generateAccessToken(user._id, user.role, user.companyId);
      const refreshToken = generateRefreshToken(user._id);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        avatar: user.avatar,
        accessToken,
        refreshToken,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'talentflow_refresh_secret_key_112233');
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user._id, user.role, user.companyId);

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// @desc    Logout user (client-side handles deletion, server just returns confirmation)
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
};
