const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: process.env.SENDGRID_EMAIL,
		subject: 'Welcome!',
		text: `Welcome to the app, ${name}. Let us know how the app is!`
	});
};

const sendGoodbyeEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: process.env.SENDGRID_EMAIL,
		subject: 'Is it Really Time to Say Goodbye?',
		text: `${name} we're sad to see you go! Please let us know what we needed to improve and hopefully you give us another chance!`
	});
};

module.exports = {
	sendWelcomeEmail,
	sendGoodbyeEmail
};
