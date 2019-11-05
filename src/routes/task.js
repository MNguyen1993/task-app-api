const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

// TASK CREATE ENDPOINT
router.post('/tasks', auth, async (req, res) => {
	const task = new Task({
		...req.body,
		owner: req.user._id
	});
	try {
		await task.save();
		res.status(201).send(task);
	} catch (err) {
		res.status(400).send(err);
	}
});

// ALL TASKS READ ENDPOINT
// Filtering: GET /tasks?completed=true
// Pagination: Get /tasks?limit=10&skip=10
// GET /tasks/tasks?sortBy=createdAt_asc or desc
router.get('/tasks', auth, async (req, res) => {
	const match = {};
	const sort = {};

	if (req.query.completed) {
		match.completed = req.query.completed === 'true';
	}

	if (req.query.sortBy) {
		const value = req.query.sortBy.split(':');
		sort[value[0]] = value[1] === 'desc' ? -1 : 1;
	}

	try {
		await req.user
			.populate({
				path: 'tasks',
				match,
				options: {
					limit: parseInt(req.query.limit),
					skip: parseInt(req.query.skip),
					sort
				}
			})
			.execPopulate();
		res.send(req.user.tasks);
	} catch (err) {
		res.status(500).send(err);
	}
});

// SINGLE TASK READ ENDPOINT
router.get('/tasks/:id', auth, async (req, res) => {
	try {
		const foundTask = await Task.findOne({
			_id: req.params.id,
			owner: req.user._id
		});

		if (!foundTask) {
			return res.status(404).send();
		}

		res.send(foundTask);
	} catch (err) {
		res.status(500).send();
	}
});

// UPDATE TASK ENDPOINT
router.patch('/tasks/:id', auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['description', 'completed'];
	const isValidUpdate = updates.every(key => allowedUpdates.includes(key));

	if (!isValidUpdate) {
		return res
			.status(400)
			.send({ error: 'Invalid update(s) included in request' });
	}

	try {
		const updatedTask = await Task.findOne({
			_id: req.params.id,
			owner: req.user._id
		});

		if (!updatedTask) {
			return res.status(404).send();
		}

		updates.forEach(update => (updatedTask[update] = req.body[update]));
		await updatedTask.save();
		res.send(updatedTask);
	} catch (err) {
		res.status(400).send(err);
	}
});

// DELETE TASK ENDPOINT
router.delete('/tasks/:id', auth, async (req, res) => {
	try {
		const deletedTask = await Task.findOneAndDelete({
			_id: req.params.id,
			owner: req.user._id
		});

		if (!deletedTask) {
			return res.status(404).send();
		}

		res.send(deletedTask);
	} catch (err) {
		res.send(500).send();
	}
});

module.exports = router;
