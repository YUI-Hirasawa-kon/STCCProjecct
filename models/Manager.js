// models/Manager.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const managerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  // display Name
  displayName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  // Repair enumeration values - ensure they match the values used during initialization.
  role: {
    type: String,
    enum: ['admin', 'superadmin'], // Make sure this contains 'superadmin'
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving
managerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// compare Password method
managerSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('🔐 Compare passwords:', {
      candidatePassword,
      storedPassword: this.password ? 'Already set' : 'Not set'
    });

    if (!candidatePassword || !this.password) {
      return false;
    }

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('🔐 Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error(' Password comparison error:', error);
    return false;
  }
};

// Remove password when converting to JSON
managerSchema.methods.toJSON = function() {
  const managerObject = this.toObject();
  delete managerObject.password;
  return managerObject;
};

// Ensure the model is exported correctly.
const Manager = mongoose.model('Manager', managerSchema);
module.exports = Manager;