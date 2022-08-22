const pool = require('../utils/pool');

module.exports = class User {
  id;
  email;
  #passwordHash;

  constructor(row) {
    this.id = row.id;
    this.email = row.email;
    this.#passwordHash = row.password_hash;
  }

  static async insert({ email, passwordHash }) {
    //creates a new row for a user, gives sanitized inputs for email and password hash
    const { rows } = await pool.query(
      `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING *
    `,
      [email, passwordHash]
    );

    return new User(rows[0]);
  }

  static async getAll() {
    //fetches all users
    const { rows } = await pool.query('SELECT * FROM users');

    return rows.map((row) => new User(row));
  }

  static async getById(id) {
    //fetches the relevant user by ID
    const { rows } = await pool.query(
      `
      SELECT *
      FROM users
      WHERE id=$1
      `,
      [id]
    );
    return new User(rows[0]);
  }

  static async getByEmail(email) {
    //fetches the relevant user by email
    const { rows } = await pool.query(
      `
      SELECT *
      FROM users
      WHERE email=$1
      `,
      [email]
    );

    if (!rows[0]) return null;

    return new User(rows[0]);
  }

  get passwordHash() {
    return this.#passwordHash;
  }
};
