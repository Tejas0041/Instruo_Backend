const axios = require('axios');
const jwt = require('jsonwebtoken');
const oauth2Client= require("../utils/oauth2client.js")
const User = require('../models/user.js');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_TIMEOUT,
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);

    console.log(process.env.JWT_COOKIE_EXPIRES_IN);
    const cookieOptions = {
        expires: new Date(Date.now() + +process.env.JWT_COOKIE_EXPIRES_IN),
        httpOnly: true,
        path: '/',
        secure: false,
    };
    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'none';
    }

    user.password = undefined;

    res.cookie('jwt', token, cookieOptions);

    // console.log(user);

    res.status(statusCode).json({
        message: 'success',
        token,
        data: {
            user,
        },
    });
};

exports.googleAuth = async (req, res, next) => {
    const code = req.query.code;
    // console.log("USER CREDENTIAL -> ", code);

    const googleRes = await oauth2Client.oauth2Client.getToken(code);

    oauth2Client.oauth2Client.setCredentials(googleRes.tokens);

    const userRes = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
	);

    let user = await User.findOne({ email: userRes.data.email });

    if (!user) {
        console.log('New User found');
        user = await User.create({
            name: userRes.data.name,
            email: userRes.data.email,
            image: userRes.data.picture,
        });
        // req.session.user= user;
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.cookie('jwt', token, { httpOnly: true });
    }

    createSendToken(user, 201, res);
};

exports.logout = (req, res, next) => {
    res.cookie('jwt', 'loggedOut', {
        expires: new Date(Date.now() - 1000),
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

    res.status(200).json({
        message: 'Logged out successfully',
    });
};