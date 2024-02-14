const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
require("dotenv").config();

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ACCESS_TOKEN_SECRET,
};

passport.use(
  new JwtStrategy(options, (jwt_payload, done) => {
    // Check if the user exists in your database
    // You might want to replace this with your own database logic
    const user = getUserFromDatabase(jwt_payload.username);

    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
      // You can also handle the case where the user is not found in your database
      // For example, you might want to return res.status(401).json({ message: 'User not found' });
    }
  })
);

const verifyJWT = passport.authenticate("jwt");

module.exports = verifyJWT;