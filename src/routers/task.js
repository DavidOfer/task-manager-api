const express = require('express');
const router = new express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const User = require('../models/User');


router.post('/tasks', auth, async (req, res, next) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });
    try {
        await task.save()
        res.status(201).send(task)
    }
    catch (err) {
        res.status(400).send(err)
    }

})


//GET /tasks?completed=true
//GET /tasks?limit=10&skip=10
//GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res, next) => {
    console.log(req.query)
    const match = {}
    const options = {}

    if (req.query.limit) { 
        options.limit = parseInt(req.query.limit)
    }
    if (req.query.skip) {
        options.skip = parseInt(req.query.skip)
    }
    if (req.query.sortBy) {
        const entries = req.query.sortBy.split(':');
        options.sort = {}
        options.sort[entries[0]] = entries[1] === "desc" ? -1 : 1
    }
    if (req.query.completed) {
        match.completed = req.query.completed === 'true';
    }
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'tasks',
                match,
                options
            })
        res.status(200).send(user.tasks)
    }
    catch (err) {
        console.log(err)
        res.status(500).send(err)
    }

})

router.get('/tasks/:id', auth, async (req, res, next) => {

    const _id = req.params.id
    try {
        // const task = await Task.findById(_id)
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.status(200).send(task)
    }
    catch (err) {
        res.status(500).send(err)
    }

})

router.patch('/tasks/:id', auth, async (req, res, next) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isUpdatesValid = updates.every((update) => allowedUpdates.includes(update));
    if (!isUpdatesValid) {
        return res.status(400).send({ error: 'invalid updates requested' });
    }
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user.id })
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        // const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).send()
        }
        updates.forEach(update => {
            task[update] = req.body[update]
        });
        await task.save()
        res.status(200).send(task)
    }
    catch (err) {
        // console.log(Object.keys(err))
        return res.status(400).send()
    }
})

router.delete('/tasks/:id', auth, async (req, res, next) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    }
    catch (err) {
        return res.status(500).send()
    }

})

module.exports = router;