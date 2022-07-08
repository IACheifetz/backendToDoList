const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');
const Todo = require('../lib/models/Todo');

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

const registerAndLogin = async (userProps = {}) => {
  const password = userProps.password ?? mockUser.password;

  const agent = request.agent(app);

  const user = await UserService.create({ ...mockUser, ...userProps });

  const { email } = user;
  await agent.post('/api/v1/users/sessions').send({ email, password });
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
    const [agent, user] = await registerAndLogin();
    const newTodo = { description: 'go shopping' };
    const resp = await agent.post('/api/v1/todos').send(newTodo);
    expect(resp.status).toEqual(200);
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
