const jwt = require('jsonwebtoken');
const { SECRET } = require('../config.js');
const User = require('../models/User');

/** Middleware: Requires user is logged in. */

function ensureLoggedIn(req, res, next) {
  try {
    const token = req.body._token || req.query._token;
    let { username } = jwt.verify(token, SECRET);
    // put username on request as a convenience for routes
    req.username = username;
    return next();
  } catch (err) {
    return next({ status: 401, message: 'Unauthorized' });
  }
}

/** Middleware: Requires :username is logged in. */

function ensureCorrectUser(req, res, next) {
  try {
    const token = req.body._token || req.query._token;
    const payload = jwt.verify(token, SECRET);
    if (payload.username === req.params.username) {
      // put username on request as a convenience for routes
      req.username = payload.username;
      return next();
    } else {
      throw new Error();
    }
  } catch (err) {
    return next({ status: 401, message: 'Unauthorized' });
  }
}
/** Middleware: make sure the person logged in is admin */

async function ensureAdmin(req, res, next) {
  try {
    const token = req.body._token || req.query._token;
    const payload = jwt.verify(token, SECRET);
    const user = await User.getUser(payload.username);
    if (payload.username === req.body._username && user.is_admin) {
      // put username on request as a convenience for routes
      req.username = payload.username;
      return next();
    } else {
      throw new Error();
    }
  } catch (err) {
    return next({ status: 401, message: 'Unauthorized' });
  }
}

module.exports = {
  ensureLoggedIn,
  ensureCorrectUser,
  ensureAdmin
};
