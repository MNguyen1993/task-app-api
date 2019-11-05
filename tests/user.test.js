const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOneId, userOne, seedDB } = require('./fixtures/db');

beforeEach(seedDB);

test('Should signup a new user', async () => {
	const response = await request(app)
		.post('/users')
		.send({
			name: 'Minh Nguyen',
			email: 'M.Nguyen20@outlook.com',
			password: 'nodeJScourse123'
		})
		.expect(201);

	// Assert that the database was changed correctly
	const user = await User.findById(response.body.user._id);
	expect(user).not.toBeNull();
	expect(user.password).not.toBe('nodeJScourse123');

	// Assertions about the response
	expect(response.body).toMatchObject({
		user: {
			name: 'Minh Nguyen',
			email: 'm.nguyen20@outlook.com'
		},
		token: user.tokens[0].token
	});
});

test('Should login an existing user', async () => {
	const response = await request(app)
		.post('/users/login')
		.send({
			email: userOne.email,
			password: userOne.password
		})
		.expect(200);

	const user = await User.findById(response.body.user._id);
	expect(response.body.token).toBe(user.tokens[1].token);
});

test('Should not login nonexistent user', async () => {
	await request(app)
		.post('/users/login')
		.send({
			email: 'nonexistent@email.com',
			password: 'nonexistentUser.password'
		})
		.expect(400);
});

test('Should get profile for user', async () => {
	await request(app)
		.get('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);
});

test('Should not get profile for unathuthenticated user', async () => {
	await request(app)
		.get('/users/me')
		.send()
		.expect(401);
});

test('Should delete account for user', async () => {
	await request(app)
		.delete('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);

	const user = await User.findById(userOneId);
	expect(user).toBeNull();
});

test('Should not delete unauthenticated user', async () => {
	await request(app)
		.delete('/users/me')
		.send()
		.expect(401);
});

test('Should upload user avatar', async () => {
	await request(app)
		.post('/users/me/avatar')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.attach('avatar', 'tests/fixtures/profile-pic.jpg')
		.expect(200);

	const user = await User.findById(userOneId);
	expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should update valid user fields', async () => {
	await request(app)
		.patch('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			name: 'April Summer',
			email: 'aprils@example.com',
			age: 22
		})
		.expect(200);

	const user = await User.findById(userOneId);
	expect(user).toMatchObject({
		name: 'April Summer',
		email: 'aprils@example.com',
		age: 22
	});
});

test('Should not update invalid user fields', async () => {
	await request(app)
		.patch('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			name: 'April Summer',
			email: 'aprils@example.com',
			age: 22,
			location: 'this should cause this to fail'
		})
		.expect(400);
});

//
// User Test Ideas
//
// Should not signup user with invalid name/email/password
// Should not update user if unauthenticated
// Should not update user with invalid name/email/password
// Should not delete user if unauthenticated
