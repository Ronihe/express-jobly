const express = require('express');
const router = new express.Router();
const Job = require('../models/Job');
const APIError = require('../models/ApiError');
const {
  ensureLoggedIn,
  ensureCorrectUser,
  ensureAdmin
} = require('../middleware/auth');

//json schema for company post
const { validate } = require('jsonschema');
const jobPostSchema = require('../schemas/jobPostSchema.json');
const jobPatchSchema = require('../schemas/jobPatchSchema.json');

/** POST /jobs - add new job
 * input:
{
  title: "CEO",
  salary: 5000000,
  equity: 0.25,
  company_handle: 'roni',
}
 * output:
{
  "job": {
    "id": 7,
    "title": "Coffee Maker",
    "salary": 5000,
    "equity": 0.01,
    "company_handle": "apple",
    "date_posted": "2018-12-20T08:00:00.000Z"
  }
}
 **/
router.post('/', ensureAdmin, async (req, res, next) => {
  const result = validate(req.body, jobPostSchema);

  if (!result.valid) {
    // pass validation errors to error handler
    let message = result.errors.map(error => error.stack);
    let status = 400;
    let error = new APIError(message, status);
    return next(error);
  }

  try {
    const job = await Job.addJob(req.body);
    return res.json({ job });
  } catch (err) {
    let error;
    if (err.message === 'Company not found.') {
      error = new APIError(err.message, 400);
    } else {
      error = Error('Server error occured.');
    }
    return next(error);
  }
});

/** GET /jobs - get detail of multiple jobs
input from req.query
{
  search,
  min_salary,
  min_equity 
}
 *
 * => {jobs: [jobsData, ...]}
 **/
router.get('/', ensureLoggedIn, async (req, res, next) => {
  try {
    const jobs = await Job.getJobs(req.query);
    return res.json({ jobs });
  } catch (error) {
    return next(error);
  }
});

/** GET /jobs/:id - get detail of specific job
 *
 * => {jobs: {jobData}}
 **/
router.get('/:id', ensureLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await Job.getJob(+id);
    return res.json({ job });
  } catch (err) {
    let error;
    if (err.message === 'Job not found.') {
      error = new APIError(err.message, 404);
    } else if (err.message === 'invalid input syntax for integer: "NaN"') {
      error = new APIError('Please provide a valid job ID.', 422);
    } else {
      error = Error('Server error occured.');
    }
    return next(error);
  }
});

/** PATCH /jobs/:id - get detail of specific job
 *
 * => {jobs: {jobData}}
 **/
router.patch('/:id', ensureAdmin, async (req, res, next) => {
  const result = validate(req.body, jobPatchSchema);
  if (!result.valid) {
    // pass validation errors to error handler
    let message = result.errors.map(error => error.stack);
    let status = 400;
    let error = new APIError(message, status);
    return next(error);
  }

  try {
    const { id } = req.params;
    const job = await Job.patchJob(+id, req.body);
    //console.log(job);
    return res.json({ job });
  } catch (err) {
    let error;
    if (err.message === 'Job not found.') {
      error = new APIError(err.message, 404);
    } else if (err.message === 'invalid input syntax for integer: "NaN"') {
      error = new APIError('Please provide a valid job ID.', 422);
    } else if (err.message === 'Company not found.') {
      error = new APIError(err.message, 404);
    } else {
      error = Error('Server error occured.');
    }
    return next(error);
  }
});

/** DELETE /jobs/:id - delete specific job
 *
 * => {message: "Job deleted"}
 **/
router.delete('/:id', ensureAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await Job.deleteJob(+id);
    return res.json({ message: 'Job deleted' });
  } catch (err) {
    let error;
    if (err.message === 'Job not found.') {
      error = new APIError(err.message, 404);
    } else if (err.message === 'invalid input syntax for integer: "NaN"') {
      error = new APIError('Please provide a valid job ID.', 422);
    } else {
      error = Error('Server error occured.');
    }
    return next(error);
  }
});

module.exports = router;
