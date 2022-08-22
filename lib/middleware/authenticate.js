const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  try {
    //checks for user's cookie
    const cookie = req.cookies[process.env.COOKIE_NAME];

    //if it isn't found, does not function and alerts that you need to sign in
    if (!cookie) throw new Error('You must be signed in to continue');

    // Verify the JWT token stored in the cookie, then attach to each request
    const user = jwt.verify(cookie, process.env.JWT_SECRET);

    req.user = user;

    next();
  } catch (err) {
    err.status = 401;
    next(err);
  }
};
