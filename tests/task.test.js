const request = require('supertest');
const Task = require('../src/models/task');
const app = require('../src/app');
const {
	userOneId,
	userOne,
	userTwo,
	taskOne,
	taskTwo,
	seedDB
} = require('./fixtures/db');

beforeEach(seedDB);

test('Should create task for authenticated user', async () => {
	const response = await request(app)
		.post('/tasks')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			description: 'Finish testing the task routes'
		})
		.expect(201);

	const task = await Task.findById(response.body._id);
	expect(task).not.toBeNull();
	expect(task.completed).toBe(false);
});

test('Should not create task with invalid description/completed', async () => {
	await request(app)
		.post('/tasks')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			description: ''
		})
		.expect(400);
});

test('Should fetch all tasks associated with userOne', async () => {
	const response = await request(app)
		.get('/tasks')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.expect(200);

	expect(response.body.length).toBe(2);
});

test('Should fetch only completed tasks', async () => {
	const response = await request(app)
		.get('/tasks?completed=true')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.expect(200);

	expect(response.body.length).toBe(1);
	expect(response.body[0].completed).toBe(true);
});

test('Should fetch only incomplete tasks', async () => {
	const response = await request(app)
		.get('/tasks?completed=false')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.expect(200);

	expect(response.body.length).toBe(1);
	expect(response.body[0].completed).toBe(false);
});

test('Should fetch and sort tasks by description/completed/createdAt/updatedAt', async () => {
	const response = await request(app)
		.get('/tasks?sortBy=createdAt_asc')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.expect(200);

	expect(response.body).toMatchObject([
		{
			description: taskOne.description
		},
		{
			description: taskTwo.description
		}
	]);
});

test('Should fetch page of tasks', async () => {
	const response = await request(app)
		.get('/tasks?limit=1&skip=1')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.expect(200);

	expect(response.body).toMatchObject([
		{
			description: taskTwo.description
		}
	]);
});

test('Should fetch task by id for authenticated user', async () => {
	const response = await request(app)
		.get(`/tasks/${taskOne._id}`)
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.expect(200);

	const task = await Task.findById(taskOne._id);
	expect(response.body).toMatchObject({
		description: task.description,
		completed: task.completed
	});
});

test('Should not fetch task by id for unauthenticated user', async () => {
	await request(app)
		.get(`/tasks/${taskOne._id}`)
		.expect(401);
});

test('Should not fetch other users task by id', async () => {
	await request(app)
		.get(`/tasks/${taskOne._id}`)
		.set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
		.expect(404);
});

test('Should not update task with invalid description/completed', async () => {
	await request(app)
		.patch(`/tasks/${taskOne._id}`)
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			description: ''
		})
		.expect(400);
});

test("Should not update userOne's task as userTwo", async () => {
	await request(app)
		.patch(`/tasks/${taskOne._id}`)
		.set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
		.expect(404);

	const task = await Task.findById(taskOne._id);
	expect(task).not.toBeNull();
});

test("Should not be able to delete userOne's task as userTwo", async () => {
	await request(app)
		.delete(`/tasks/${taskOne._id}`)
		.set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
		.expect(404);

	const task = await Task.findById(taskOne._id);
	expect(task).not.toBeNull();
});

test("Should delete userOne's taskOne", async () => {
	await request(app)
		.delete(`/tasks/${taskOne._id}`)
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.expect(200);

	const task = await Task.findById(taskOne._id);
	expect(task).toBeNull();
});

test('Should not delete task if unauthenticated', async () => {
	await request(app)
		.delete(`/tasks/${taskOne._id}`)
		.expect(401);
});
