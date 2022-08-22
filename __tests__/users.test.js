const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');

//mocks out fake users with placeholder information for testing
const mockUser = {
  email: 'test@example.com',
  password: '123456',
};

//mocks out a user registering and logging in for testing, same as in other test file
const registerAndLogin = async (userProps = {}) => {
  const password = userProps.password ?? mockUser.password;

  const agent = request.agent(app);

  const user = await UserService.create({ ...mockUser, ...userProps });

  const { email } = user;
  await agent.post('/api/v1/users/sessions').send({ email, password });
  return [agent, user];
};

describe('users', () => {
  beforeEach(() => {
    return setup(pool);
  });

  afterAll(() => {
    pool.end();
  });

  it('creates a new user', async () => {
    //calls our mock signup for the test
    const res = await request(app).post('/api/v1/users').send(mockUser);
    const { email } = mockUser;
    //and checks if a user was created properly
    expect(res.body).toEqual({
      id: expect.any(String),
      email,
    });
  });

  it('returns the current user', async () => {
    const [agent, user] = await registerAndLogin();
    //test tries to grab the mocked user
    const me = await agent.get('/api/v1/users/me');
    //and then checks to ensure the correct user was retrieved
    expect(me.body).toEqual({
      ...user,
      exp: expect.any(Number),
      iat: expect.any(Number),
    });
  });

  it('DELETE /sessions deletes the user session', async () => {
    const [agent] = await registerAndLogin();
    const resp = await agent.delete('/api/v1/users/sessions');
    expect(resp.status).toBe(204);
  });
});
