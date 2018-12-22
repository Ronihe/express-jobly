process.env.NODE_ENV = 'test';

// npm pacakges
const request = require('supertest');
const Job = require('../../models/Job');
const Company = require('../../models/Company');
const User = require('../../models/User');

// app imports
const app = require('../../app');
const db = require('../../db');

let bobToken;
let adaToken;
beforeEach(async () => {
  // delete any data created by prior tests
  await db.query('DELETE FROM companies');
  await db.query('DELETE FROM users');

  await User.addUser({
    username: 'bob',
    password: '123456',
    first_name: 'bobby',
    last_name: 'wow',
    email: 'bobbbby@goodboy.com',
    photo_url: 'https://www.wow.com/pic.jpg',
    is_admin: false
  });
  await User.addUser({
    username: 'ada',
    password: '123456',
    first_name: 'bobby',
    last_name: 'wow',
    email: 'ada@goodboy.com',
    photo_url: 'https://www.wow.com/pic.jpg',
    is_admin: true
  });

  await Company.addCompany({
    handle: 'roni',
    name: 'Roni Inc',
    num_employees: 5
  });

  await Company.addCompany({
    handle: 'google',
    name: 'Google Inc',
    num_employees: 5000
  });

  // add jobs
  await Job.addJob({
    title: 'CEO',
    salary: 5000000,
    equity: 0.25,
    company_handle: 'roni'
  });

  await Job.addJob({
    title: 'CTO',
    salary: 500000000,
    equity: 0.5,
    company_handle: 'google'
  });

  const bobResponse = await request(app)
    .post('/login')
    .send({
      username: 'bob',
      password: '123456'
    });
  const adaResponse = await request(app)
    .post('/login')
    .send({
      username: 'ada',
      password: '123456'
    });

  bobToken = bobResponse.body.token;
  adaToken = adaResponse.body.token;
});

describe('POST /jobs', () => {
  it('Adding a job succeeded', async () => {
    const response = await request(app)
      .post('/jobs')
      .send({
        title: 'CFO',
        salary: 100000,
        equity: 0.1,
        company_handle: 'google',
        _token: adaToken,
        _username: 'ada'
      });
    const { job } = response.body;
    expect(response.statusCode).toBe(200);
    expect(job).toHaveProperty('title', 'CFO');
  });
  it('Adding a job failed, because the person is not admin', async () => {
    const response = await request(app)
      .post('/jobs')
      .send({
        title: 'CFO',
        salary: 100000,
        equity: 0.1,
        company_handle: 'google',
        _token: bobToken,
        _username: 'bob'
      });
    const { error } = response.body;
    expect(error.status).toBe(401);
    expect(error).toHaveProperty('message');
  });

  it('Adding a job failed, equity invalid', async () => {
    const response = await request(app)
      .post('/jobs')
      .send({
        title: 'CFO',
        salary: 100000,
        equity: 5,
        company_handle: 'google',
        _token: adaToken,
        _username: 'ada'
      });
    const { error } = response.body;
    expect(error.status).toBe(400);
    expect(error).toHaveProperty('message');
  });

  it('Adding a job failed, missing params', async () => {
    const response = await request(app)
      .post('/jobs')
      .send({
        title: 'CFO',
        salary: 100000,
        equity: 5,
        _token: adaToken,
        _username: 'ada'
      });
    const { error } = response.body;
    expect(error.status).toBe(400);
    expect(error).toHaveProperty('message');
  });
});

describe('GET /jobs', () => {
  it('get all jobs succeeded', async () => {
    const response = await request(app)
      .get('/jobs')
      .query({ _token: bobToken });
    const { jobs } = response.body;
    expect(response.statusCode).toBe(200);
    expect(jobs).toHaveLength(2);
  });
  it('get specific job min_salalry = 50000000', async () => {
    const response = await request(app)
      .get('/jobs')
      .query({ _token: bobToken, min_salary: 50000000 });
    const { jobs } = response.body;
    expect(response.statusCode).toBe(200);
    expect(jobs).toHaveLength(1);
  });
  it('get specific job returned no results because min_salalry = 80000000000 ', async () => {
    const response = await request(app)
      .get('/jobs')
      .query({ _token: bobToken, min_salary: 80000000000 });
    const { jobs } = response.body;
    expect(response.statusCode).toBe(200);
    expect(jobs).toHaveLength(0);
  });
});

describe('GET /jobs/:id', () => {
  it('get any specific job succeeded', async () => {
    const jobs = await Job.getJobs({});
    const firstId = jobs[0].id;

    const response = await request(app)
      .get(`/jobs/${firstId}`)
      .query({ _token: bobToken });
    const { job } = response.body;
    expect(response.statusCode).toBe(200);
    expect(job).toHaveProperty('title', 'CEO');
  });

  it('fail to get non existing job', async () => {
    const response = await request(app)
      .get(`/jobs/0`)
      .query({ _token: bobToken });
    const { error } = response.body;
    expect(error.status).toBe(404);
    expect(error).toHaveProperty('message');
  });

  it('user passed in non number job id', async () => {
    const response = await request(app)
      .get(`/jobs/abc`)
      .query({ _token: bobToken });
    const { error } = response.body;
    expect(error.status).toBe(422);
    expect(error).toHaveProperty('message');
  });
});

describe('PATCH /jobs/:id', () => {
  it('updates a specific job succeeded', async () => {
    const jobs = await Job.getJobs({});
    const firstId = jobs[0].id;

    const response = await request(app)
      .patch(`/jobs/${firstId}`)
      .send({
        title: 'CEEEEEEEEO',
        salary: 5,
        equity: 0.0001,
        company_handle: 'google',
        _token: adaToken,
        _username: 'ada'
      });
    const { job } = response.body;
    expect(response.statusCode).toBe(200);
    expect(job).toHaveProperty('title', 'CEEEEEEEEO');
  });

  it('fails to update because of not admin', async () => {
    const jobs = await Job.getJobs({});
    const firstId = jobs[0].id;

    const response = await request(app)
      .patch(`/jobs/${firstId}`)
      .send({
        title: 'CEEEEEEEEO',
        salary: 5,
        equity: 0.0001,
        company_handle: 'wooooooooo',
        _token: bobToken,
        _username: 'bob'
      });
    const { error } = response.body;
    expect(error.status).toBe(401);
    expect(error).toHaveProperty('message');
  });

  it('fails to update because of invalid company', async () => {
    const jobs = await Job.getJobs({});
    const firstId = jobs[0].id;

    const response = await request(app)
      .patch(`/jobs/${firstId}`)
      .send({
        title: 'CEEEEEEEEO',
        salary: 5,
        equity: 0.0001,
        company_handle: 'wooooooooo',
        _token: adaToken,
        _username: 'ada'
      });
    const { error } = response.body;
    expect(error.status).toBe(404);
    expect(error).toHaveProperty('message');
  });

  it('fails to update because of invalid params', async () => {
    const jobs = await Job.getJobs({});
    const firstId = jobs[0].id;

    const response = await request(app)
      .patch(`/jobs/${firstId}`)
      .send({
        cookies: 'yes!',
        _token: adaToken,
        _username: 'ada'
      });

    const { error } = response.body;
    expect(error.status).toBe(400);
    expect(error).toHaveProperty('message');
  });
});

describe('DELETE /jobs/:id', () => {
  it('deleting a specific job failed because not admin ', async () => {
    const jobs = await Job.getJobs({});
    const firstId = jobs[0].id;
    const response = await request(app)
      .delete(`/jobs/${firstId}`)
      .send({ _token: bobToken, _username: 'bob' });
    const { error } = response.body;
    expect(error.status).toBe(401);
    expect(error).toHaveProperty('message');
  });

  it('deletes a specific job successfully', async () => {
    const jobs = await Job.getJobs({});
    const firstId = jobs[0].id;
    const response = await request(app)
      .delete(`/jobs/${firstId}`)
      .send({ _token: adaToken, _username: 'ada' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Job deleted');
  });

  it('fails to delete non existing job', async () => {
    const response = await request(app)
      .delete(`/jobs/100000`)
      .send({ _token: adaToken, _username: 'ada' });

    const { error } = response.body;
    expect(error.status).toBe(404);
    expect(error).toHaveProperty('message', 'Job not found.');
  });
});

afterEach(async function() {
  // delete any data created by test
  await db.query('DELETE FROM companies');
  await db.query('DELETE FROM users');
});

afterAll(async function() {
  // close db connection
  await db.end();
});
