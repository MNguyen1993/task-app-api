const express = require('express');
require('./db/mongoose');

// User and Task Routes
const userRouter = require('./routes/user');
const taskRouter = require('./routes/task');

const app = express();

app.use(express.json()); // customizes the express server to parse JSON to an object
app.use(userRouter);
app.use(taskRouter);

module.exports = app;
