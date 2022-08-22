const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');
const Todo = require('../lib/models/Todo');

//mocks out fake users with placeholder information for testing
const mockUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: '123456',
};
const mockUser2 = {
  firstName: 'Test',
  lastName: 'User 2',
  email: 'test2@example.com',
  password: '123456',
};

//mocks out a user registering and logging in for testing
const registerAndLogin = async (userProps = {}) => {
  //associates test user password with the table's relevant row
  const password = userProps.password ?? mockUser.password;
  //can't remember at the moment what the exact function of the supertest.agent stuff does
  const agent = request.agent(app);
  //setting a variable that calls our user service and sets it up with our mock user
  const user = await UserService.create({ ...mockUser, ...userProps });

  //creates an email object equal to the user
  const { email } = user;
  //asynchronously sends the information set up above for testing
  await agent.post('/api/v1/users/sessions').send({ email, password });
  //and returns it
  return [agent, user];
};

describe('todos', () => {
  beforeEach(() => {
    return setup(pool);
  });
  afterAll(() => {
    pool.end();
  });
  it('POST /api/v1/todos creates a new to-do list item with the current user', async () => {
    //calls our mock signup for the test
    const [agent, user] = await registerAndLogin();
    //creates a stock entry for the to-do list
    const newTodo = { description: 'go shopping' };
    //sends the created entry to the table
    const resp = await agent.post('/api/v1/todos').send(newTodo);
    expect(resp.status).toEqual(200);
    //sets up the expected fields for comparing to ensure the above mock user and test submission were able to operate properly
    expect(resp.body).toEqual({
      id: expect.any(String),
      description: newTodo.description,
      user_id: user.id,
      complete: false,
    });
  });

  it('GET /api/v1/todos returns all to-do items associated with the authenticated User', async () => {
    const [agent, user] = await registerAndLogin();
    const user2 = await UserService.create(mockUser2);
    const user1Todo = await Todo.insert({
      description: 'go to the farmer\'s market',
      user_id: user.id,
    });
    await Todo.insert({
      description: 'go to furniture store',
      user_id: user2.id,
    });
    const resp = await agent.get('/api/v1/todos');
    expect(resp.status).toEqual(200);
    expect(resp.body).toEqual([user1Todo]);
  });

  it('GET /api/v1/todos should return a 401 if not authenticated', async () => {
    //tries to access to-do list to test if auth protections are working
    const resp = await request(app).get('/api/v1/todos');
    expect(resp.status).toEqual(401);
  });

  it('UPDATE /api/v1/todos/:id should update an list item', async () => {
    const [agent, user] = await registerAndLogin();
    const todo = await Todo.insert({
      description: 'go shopping',
      user_id: user.id,
    });
    const resp = await agent
      .put(`/api/v1/todos/${todo.id}`)
      .send({ complete: true });
    expect(resp.status).toBe(200);
    expect(resp.body).toEqual({ ...todo, complete: true });
  });

  it('UPDATE /api/v1/todos/:id should 403 for invalid users', async () => {
    const [agent] = await registerAndLogin();
    const user2 = await UserService.create(mockUser2);
    const todo = await Todo.insert({
      description: 'go shopping',
      user_id: user2.id,
    });
    const resp = await agent
      .put(`/api/v1/todos/${todo.id}`)
      .send({ complete: true });
    expect(resp.status).toBe(403);
  });

  it('DELETE /api/v1/todos/:id should delete list items for valid user', async () => {
    const [agent, user] = await registerAndLogin();
    const todo = await Todo.insert({
      description: 'go shopping',
      user_id: user.id,
    });
    const resp = await agent.delete(`/api/v1/todos/${todo.id}`);
    expect(resp.status).toBe(200);

    const check = await Todo.getById(todo.id);
    expect(check).toBeNull();
  });
});
