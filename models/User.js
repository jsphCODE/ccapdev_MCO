const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },

    //Not required since some people may not have middle names
    middleName: {
        type: String,
        trim: true
    },

    lastName: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    //Phone number is not required to create a user account
    phone: {
        type: String,
        //match: '^(09|\+639)\d{9}$',
        trim: true
    },
    
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    password: {
        type: String,
        required: true,
        trim: true
    },

    isAdmin: {
        type: Boolean,
        required: true,
        default: false
    }
}, { timestamps: true });

// Hash passwords before saving to DB, should reflect when viewing the DB
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Only hash if password is new or modified
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Edit profile vers.
UserSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate()
  // Check if the update operation specifically includes a 'password' field
  // Mongoose usually wraps updates in a $set operator
  const passwordToHash = update.$set?.password || update.password;

  if (passwordToHash) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordToHash, salt);
            
        // Update the password value in the update object itself
        if (update.$set) {
            update.$set.password = hashedPassword;
        } else {
        // Fallback for flat updates
            update.password = hashedPassword;
        }
    } catch (err) {
        return next(err);
      }
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
