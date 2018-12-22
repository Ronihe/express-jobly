const db = require('../db'); //connect to db
const bcrypt = require('bcrypt');
const sqlForPartialUpdate = require('../helpers/partialUpdate');
const { BCRYPT_ROUNDS_OF_WORK } = require('../config');

class User {
  /** addUser -- add a new user
  input: 
  {
    username: 'roni,
    password: '123456',
    first_name: 'roni',
    last_name: 'h,
    email: 'rh@abcdefg.com,
    photo_url: 'https://www.wow.com/pic.jpg,
    is_admin: true
  } =>
  output:
  {
    username: 'roni',
    password: 'ldask;fsadkfdfsafjljf;',
    first_name: 'roni',
    last_name: 'h,
    email: 'rh@abcdefg.com,
    photo_url: 'https://www.wow.com/pic.jpg,
    is_admin: true
  }
   */
  static async addUser({
    username,
    password,
    first_name,
    last_name,
    email,
    photo_url,
    is_admin
  }) {
    // checks if user exists, if not, throw error
    // await User.getUser(username);

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS_OF_WORK);
    const user = await db.query(
      `INSERT INTO users (
        username,
        password,
        first_name,
        last_name,
        email,
        photo_url,
        is_admin
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        username,
        hashedPassword,
        first_name,
        last_name,
        email,
        photo_url,
        is_admin
      ]
    );
    return user.rows[0];
  }

  /** getUsers -- get all users */
  static async getUsers() {
    const user = await db.query(`SELECT * FROM users`);
    return user.rows;
  }

  /** getUser -- get specific user */
  static async getUser(username) {
    const results = await db.query(
      `SELECT u.username, first_name, last_name, email, photo_url, is_admin, job_id,j.title, j.company_handle, a.state FROM users as u LEFT JOIN applications AS a ON u.username = a.username LEFT JOIN jobs AS j ON a.job_id = j.id WHERE u.username = $1`,
      [username]
    );

    // if user cannot be found, throw error
    if (results.rows.length === 0) {
      throw new Error('User does not exist.');
    }
    return results.rows[0];
  }

  /** patchUser -- update specific user details */
  static async patchUser(username, userDetails) {
    // check if user exists
    await User.getUser(username);

    const { query, values } = sqlForPartialUpdate(
      'users',
      userDetails,
      'username',
      username
    );

    const result = await db.query(query, values);
    const user = result.rows[0];
    return {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      photo_url: user.photo_url
    };
  }

  /** deleteUser -- delete a specific user */
  static async deleteUser(username, userDetails) {
    // check if user exists
    await User.getUser(username);

    const result = await db.query(
      `DELETE FROM users WHERE username = $1 RETURNING *`,
      [username]
    );
    return result.rows[0];
  }

  /** check User is valid */
  static async checkValidUser(username, inputPassword) {
    // check if user exists
    await User.getUser(username);

    const result = await db.query(
      'SELECT password FROM users WHERE username = $1',
      [username]
    );

    const { password } = result.rows[0];

    const isValid = await bcrypt.compare(inputPassword, password);
    if (!isValid) {
      throw new Error('Invalid Password');
    }
  }
}

module.exports = User;
