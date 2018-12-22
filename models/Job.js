const db = require('../db'); //connect to db
const Company = require('./Company');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

class Job {
  /** addJob -- add a new job posting
  input: 
    {
      title: "CEO",
      salary: 5000000,
      equity: 0.25,
      company_handle: 'roni',
    }
   */
  static async addJob({ title, salary, equity, company_handle }) {
    // checks if company exists, if not, throw error
    await Company.getCompany(company_handle);

    const job = await db.query(
      `INSERT INTO jobs (title, salary, equity,company_handle) VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, salary, equity, company_handle]
    );

    return job.rows[0];
  }

  /** getJobs -- retreive jobs 
   input: from request body {
     search,
     min_salary,
     min_equity 
   }
   output: =>
    [{
      "id": 8,
      "title": "CEO",
      "salary": 5000000,
      "equity": 0.1,
      "company_handle": "roni",
      "date_posted": "2018-12-20T08:00:00.000Z"
    }]
   */
  static async getJobs(jobParams) {
    //clear out invalid params
    for (let key in jobParams) {
      if (!jobParams[key]) {
        delete jobParams[key];
      }
    }

    for (let key in jobParams) {
      if (key.startsWith('_')) {
        delete jobParams[key];
      }
    }

    let queryString = 'SELECT * FROM jobs';
    const jobsParamsQueryArray = Object.keys(jobParams);
    const values = [];
    let counter = 1;

    if (jobsParamsQueryArray.length > 0) {
      queryString += ' WHERE';

      const dynamicArr = [];
      if (jobParams.search) {
        dynamicArr.push(
          ` title LIKE $${counter} OR company_handle LIKE $${counter}`
        );
        values.push(jobParams.search);
        counter++;
      }
      if (jobParams.min_salary) {
        dynamicArr.push(` salary > $${counter}`);
        values.push(jobParams.min_salary);
        counter++;
      }
      if (jobParams.min_equity) {
        dynamicArr.push(` equity < $${counter}`);
        values.push(jobParams.min_equity);
        counter++;
      }
      queryString += dynamicArr.join(' AND');
    }

    const result = await db.query(queryString, values);
    return result.rows;
  }

  /** get specific job details */
  static async getJob(id) {
    const job = await db.query(`SELECT * FROM jobs WHERE id = $1`, [id]);

    if (job.rows.length === 0) {
      throw new Error('Job not found.');
    }
    return job.rows[0];
  }

  /** patch job details */
  static async patchJob(id, jobDetails) {
    // will throw error if job does not exist
    await Job.getJob(id);

    // parseJob Details  for company_handle
    const updatedCompHandle = jobDetails.company_handle;
    // check updated Company exists, if not throws error

    await Company.getCompany(updatedCompHandle);
    const { query, values } = sqlForPartialUpdate('jobs', jobDetails, 'id', id);
    const jobResults = await db.query(query, values);
    return jobResults.rows[0];
  }

  /** delete job */
  static async deleteJob(id) {
    // will throw error if job does not exist
    await Job.getJob(id);

    const jobResults = await db.query(
      `DELETE FROM jobs WHERE id = $1 RETURNING *`,
      [id]
    );

    return jobResults.rows[0];
  }
}

module.exports = Job;
