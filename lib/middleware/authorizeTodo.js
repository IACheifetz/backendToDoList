const Todo = require('../models/Todo');

module.exports = async (req, res, next) => {
  try {
    //sets variable that uses to-do model
    const todo = await Todo.getById(req.params.id);

    //checks if the user's ID matches, if it doesn't access is blocked
    if (!todo || todo.user_id !== req.user.id) {
      throw new Error('You do not have access to view this page');
    }
    next();
  } catch (e) {
    e.status = 403;
    next(e);
  }
};
