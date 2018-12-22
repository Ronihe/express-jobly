/** Express app for jobly. */

const express = require('express');
const app = express();
app.use(express.json()); // middleware to parse json, so express can read json
const APIError = require('./models/ApiError');
const userSetup = require('./helpers/addUserData');

//add user data
//userSetup();

// add logging system
const morgan = require('morgan');
app.use(morgan('tiny'));

// import routes
const authRoutes = require('./routes/auth');
const companiesRoutes = require('./routes/companies');
const jobsRoutes = require('./routes/jobs');
const usersRoutes = require('./routes/users');

// routing control
app.use(authRoutes);
app.use('/companies', companiesRoutes);
app.use('/jobs', jobsRoutes);
app.use('/users', usersRoutes);

/** 404 handler */
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */
app.use(function(err, req, res, next) {
  // all errors that get to here get coerced into API Errors
  if (!(err instanceof APIError)) {
    err = new APIError(err.message, err.status);
  }

  return res.status(err.status).json(err);
});

module.exports = app;
