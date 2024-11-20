const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/users');

const router = express.Router();

// User login route
router.post('/login', async (req, res) => {
    // Check if user exists
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
        return res.status(400).send('User not found');
    }

    // Check if password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) {
        return res.status(400).send('Invalid password');
    }

    // Create and assign a token
    const token = user.generateAuthToken();
    res.header('auth-token', token).send(token);
});

//Method to register user
router.post('/register', async (req, res) => {
    // Check if user exists
    const user = await User.findOne({ username: req.body.username });
    if (user) {
        return res.status(400).send('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create new user
    const newUser = new User({
        username: req.body.username,
        password: hashedPassword,
        roles: ["Admin", "User"]
    });

    try {
        const savedUser = await newUser.save();
        res.send(savedUser);
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;
