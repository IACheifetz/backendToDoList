const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = class UserService {
  static async create({ email, password }) {
    //ensures email length is long enough to be valid
    if (email.length <= 6) {
      throw new Error('Invalid email');
    }
    //checks to ensure the password is long enough to be relatively secure
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    //hashes the password using the bcrypt library for the number of salt rounds specified in the env file
    const passwordHash = await bcrypt.hash(
      password,
      Number(process.env.SALT_ROUNDS)
    );
    //creates a user with the inputted email and the password hash generated
    const user = await User.insert({
      email,
      passwordHash,
    });

    return user;
  }

  static async signIn({ email, password = '' }) {
    //checks if the email inputted has been used to create a user
    try {
      const user = await User.getByEmail(email);
      //if not prompts with error
      if (!user) throw new Error('Invalid email');
      //checks if the password matches the hashed password stored
      if (!bcrypt.compareSync(password, user.passwordHash))
      //if not prompts with error
        throw new Error('Invalid password');

      //associates with the JWT specified in env file and gives an expiry date of 1 day
      const token = jwt.sign({ ...user }, process.env.JWT_SECRET, {
        expiresIn: '1 day',
      });

      return token;
    } catch (error) {
      error.status = 401;
      throw error;
    }
  }
};
