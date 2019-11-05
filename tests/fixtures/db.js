const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
	_id: userOneId,
	name: 'April',
	email: 'april@example.com',
	password: '32helloBase',
	tokens: [
		{
			token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
		}
	]
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
	_id: userTwoId,
	name: 'Courtney Sims',
	email: 'courtneysims@example.com',
	password: 'crazyLady9886',
	tokens: [
		{
			token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET)
		}
	]
};

const taskOne = {
	_id: new mongoose.Types.ObjectId(),
	description: 'Finish testing the task routes',
	owner: userOneId
};

const taskTwo = {
	_id: new mongoose.Types.ObjectId(),
	description: 'Another testing task is here!',
	completed: true,
	owner: userOneId
};

const taskThree = {
	_id: new mongoose.Types.ObjectId(),
	description: 'The last task you will ever need',
	completed: true,
	owner: userTwoId
};

const seedDB = async () => {
	await User.deleteMany();
	await new User(userOne).save();
	await new User(userTwo).save();

	await Task.deleteMany();
	await new Task(taskOne).save();
	await new Task(taskTwo).save();
	await new Task(taskThree).save();
};

module.exports = {
	userOneId,
	userOne,
	userTwo,
	taskOne,
	taskTwo,
	seedDB
};
