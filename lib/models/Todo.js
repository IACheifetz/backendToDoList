const pool = require('../utils/pool');

module.exports = class Todo {
  //basic set up for a class in relation to our todo SQL table
  id;
  description;
  user_id;
  complete;

  //sets a constructor that declares what goes to which columns in the row
  constructor(row) {
    this.id = row.id;
    this.description = row.description;
    this.user_id = row.user_id;
    this.complete = row.complete;
  }

  //asynchronous function to create a to do list item
  static async insert({ description, user_id }) {
    const { rows } = await pool.query(
      //inserts into the table with sanitized inputs for the item description and the related user ID
      `
      INSERT INTO todos (description, user_id)
      VALUES ($1, $2)
      RETURNING *
    `,
      [description, user_id]
    );

    return new Todo(rows[0]);
  }

  static async updateById(id, attrs) {
    //checks to ensure the user has the authorization to update a list item
    const todo = await Todo.getById(id);
    //returns nothing if no match
    if (!todo) return null;
    const { description, complete } = { ...todo, ...attrs };
    //if matching updates the row with the new inputs
    const { rows } = await pool.query(
      `
      UPDATE todos 
      SET description=$2, complete=$3 
      WHERE id=$1 RETURNING *`,
      [id, description, complete]
    );
    return new Todo(rows[0]);
  }

  static async getById(id) {
    //pulls the row with the relevant ID
    const { rows } = await pool.query(
      `
      SELECT *
      FROM todos
      WHERE id=$1
      `,
      [id]
    );
    //returns nothing if empty
    if (!rows[0]) {
      return null;
    }
    return new Todo(rows[0]);
  }
  
  static async getAll(user_id) {
    //pulls all rows associated with the user's ID
    const { rows } = await pool.query(
      'SELECT * from todos where user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    return rows.map((todo) => new Todo(todo));
  }

  static async delete(id) {
    //deletes row with relevant ID
    const { rows } = await pool.query(
      'DELETE FROM todos WHERE id = $1 RETURNING *',
      [id]
    );
    return new Todo(rows[0]);
  }
};
