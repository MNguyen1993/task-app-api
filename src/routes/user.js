const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendGoodbyeEmail } = require('../emails/account');
const router = new express.Router();

// USER CREATE ENDPOINT
router.post('/users', async (req, res) => {
	const user = new User(req.body);

	try {
		await user.save();
		sendWelcomeEmail(user.email, user.name);
		const token = await user.generateAuthToken();
		res.status(201).send({ user, token });
	} catch (err) {
		res.status(400).send(err);
	}
});

// USER LOGIN ENDPOINT
router.post('/users/login', async (req, res) => {
	try {
		const user = await User.findByCredentials(
			req.body.email,
			req.body.password
		);
		const token = await user.generateAuthToken();
		res.send({ user, token });
	} catch (err) {
		res.status(400).send();
	}
});

// USER LOGOUT ENDPOINT
router.post('/users/logout', auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter(
			token => token.token !== req.token
		);
		await req.user.save();

		res.send();
	} catch (err) {
		res.status(500).send();
	}
});

// USER LOGOUT ALL ENDPOINT
router.post('/users/logoutAll', auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (err) {
		res.status(500).send();
	}
});

// AUTH USER'S PROFILE ENDPOINT
router.get('/users/me', auth, async (req, res) => {
	res.send(req.user);
});

// USER UPDATE ENDPOINT
router.patch('/users/me', auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['name', 'email', 'password', 'age'];
	const isValidUpdate = updates.every(key => allowedUpdates.includes(key));

	if (!isValidUpdate) {
		return res
			.status(400)
			.send({ error: 'Invalid update(s) included in request' });
	}

	try {
		updates.forEach(update => (req.user[update] = req.body[update]));
		await req.user.save();
		res.send(req.user);
	} catch (err) {
		res.status(400).send(err);
	}
});

// DELETE USER ENDPOINT
router.delete('/users/me', auth, async (req, res) => {
	try {
		await req.user.remove();
		sendGoodbyeEmail(req.user.email, req.user.name);
		res.send(req.user);
	} catch (err) {
		res.status(500).send();
	}
});

// Multer config for file upload
const upload = multer({
	limits: {
		fileSize: 1000000
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error('Please upload a JPEG or PNG Image'));
		}

		cb(undefined, true);
	}
});

// USER CREATE/UPDATE/UPLOAD AVATAR
router.post(
	'/users/me/avatar',
	auth,
	upload.single('avatar'),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer)
			.resize(250, 250)
			.png()
			.toBuffer();
		req.user.avatar = buffer;
		await req.user.save();
		res.send();
	},
	(err, req, res, next) => {
		res.status(400).send({ error: err.message });
	}
);

// USER READ AVATAR
router.get('/users/:id/avatar', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user || !user.avatar) {
			throw new Error();
		}

		res.set('Content-Type', 'image/png');
		res.send(user.avatar);
	} catch (err) {
		res.status(404).send();
	}
});

// USER DELETE AVATAR
router.delete('/users/me/avatar', auth, async (req, res) => {
	req.user.avatar = undefined;
	await req.user.save();
	res.send();
});

module.exports = router;
