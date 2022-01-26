const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const Task = require('./Task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique:true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('password must not contain the word password');
            }
        }

    },
    age: {
        type: Number,
        default: 0
    },
    tokens: [{
        token:{
            type:String,
            required:true
        }
    }],
    avatar:{
        type:Buffer
    }
},{
    timestamps:true
})

userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})

userSchema.methods.generateAuthToken = async function(){
    const user = this;
    const token = jwt.sign({_id:user._id.toString()},process.env.JWT_SECRET);

    user.tokens= user.tokens.concat({token})
    await user.save()
    return token;
}

userSchema.methods.toJSON = function(){
    const user = this;
    const userObject =user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar
    return userObject;
}

userSchema.statics.findByCredentials = async (email, plainPassword) =>{
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error('Unable to login');
    }
    const isMatch = await bcrypt.compare(plainPassword, user.password);
    if (!isMatch) {
        throw new Error('Unable to login');
    }
    return user;
}


//hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 12)
    }
    next()
})

userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({owner:user._id})
    next()
})

const User = mongoose.model('User', userSchema)
module.exports = User;