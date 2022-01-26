const express = require('express');
require('./db/mongoose');
const userRoutes = require('./routers/user');
const taskRoutes = require('./routers/task');

const app = express()
const port = process.env.PORT;

app.use(express.json());
app.use(userRoutes);
app.use(taskRoutes);

app.listen(port, () => {
    console.log('server is up on port ' + port);
});


