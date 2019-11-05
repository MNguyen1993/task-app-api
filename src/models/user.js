const mongoose = require('mongoose'),
	validator = require('validator'),
	bcrypt = require('bcryptjs'),
	jwt = require('jsonwebtoken'),
	Task = require('../models/task');

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true
		},
		age: {
			type: Number,
			default: 0,
			validate(value) {
				if (value < 0) {
					throw new Error('Age must be a positive number');
				}
			}
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
			validate(value) {
				if (!validator.isEmail(value)) {
					throw new Error('Email is invalid');
				}
			}
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
			trim: true,
			validate(value) {
				if (value.toLowerCase().includes('password')) {
					throw new Error('Password cannot contain "password');
				}
			}
		},
		tokens: [
			{
				token: {
					type: String,
					required: true
				}
			}
		],
		avatar: {
			type: Buffer
		}
	},
	{ timestamps: true }
);

// virtual property, which setups a relationship between entities/resources
// not stored in the db, allows mongoose to understand the relationship
userSchema.virtual('tasks', {
	ref: 'Task',
	localField: '_id',
	foreignField: 'owner'
});

userSchema.methods.toJSON = function() {
	const userObject = this.toObject(); // converts from mongoose document to JS object

	delete userObject.password;
	delete userObject.tokens;
	delete userObject.avatar;

	return userObject;
};

userSchema.methods.generateAuthToken = async function() {
	const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET);

	this.tokens.push({ token });
	await this.save();

	return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
	user = await User.findOne({ email });

	if (!user) {
		throw new Error('Unable to login');
	}

	const isMatch = await bcrypt.compare(password, user.password);

	if (!isMatch) {
		throw new Error('Unable to login');
	}

	return user;
};

// Hash the plain text password before saving
userSchema.pre('save', async function(next) {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 8);
	}

	next();
});

// Delete user tasks when user is removed
userSchema.pre('remove', async function(next) {
	await Task.deleteMany({ owner: this._id });
	next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
