const express = require('express');
const multer = require('multer');
const sharp = require('sharp')
const User = require('../models/User');
const router = new express.Router();
const auth = require('../middleware/auth');
const {sendWelcomeEmail } = require('../emails/account');



router.post('/users', async (req, res, next) => {
    const user = new User(req.body)
    try {
        await user.save()
        sendWelcomeEmail(user.email,user.name);
        const token = await user.generateAuthToken()
        return res.status(201).send({ user, token });
    }
    catch (err) {
        res.status(400).send(err)
    }
});

router.post('/users/login', async (req, res, next) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        return res.send({ user, token })
    }
    catch (err) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res, next) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        return res.send()
    }
    catch (err) {
        res.status(500).send()
    }
})

router.post('/users/logoutall', auth, async (req, res, next) => {
    try {
        req.user.tokens = [];
        await req.user.save()
        return res.send()
    }
    catch (err) {
        res.status(500).send()
    }
})


router.get('/users/me', auth, async (req, res, next) => {
    res.send(req.user);
})

// router.get('/users/:id', async (req, res, next) => {
//     const _id = req.params.id;
//     try {
//         const result = await User.findById(_id);
//         if (!result) {
//             return res.status(404).send();
//         }
//         res.status(200).send(result);
//     }
//     catch (err) {
//         res.status(500).send(err);
//     }
// })

router.patch('/users/me', auth, async (req, res, next) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidUpdate = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidUpdate) {
        return res.status(400).send({ error: 'invalid updates!' })
    }
    try {
        const user = req.user;
        updates.forEach(update => {
            user[update] = req.body[update];
        })

        await user.save()
        res.status(200).send(user)
    }
    catch (err) {
        res.status(400).send(err)
        // res.status(500).send(err)
    }
})

router.delete('/users/me', auth, async (req, res, next) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id)
        // if (!user) {
        //     return res.status(404).send()
        // }
        await req.user.remove();
        res.send(req.user);
    }
    catch (err) {
        return res.status(500).send()
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('Please upload a png, jpg or jpeg'))
        }
        cb(undefined, true);
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res, next) => {

    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer
    await req.user.save()
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    }
    catch (err) {
        res.status(404).send()
    }
})

module.exports = router;