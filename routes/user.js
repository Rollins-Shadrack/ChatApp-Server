const express = require('express')
const router = express.Router() //const router = require('express').Router()
const  User  = require('../models/User')
const bcrypt = require('bcryptjs')


//creating new User
router.post('/' ,async(req,res) =>{
    try {
        const {name, email, password, picture} = req.body;
        console.log(req.body);
        const user = await User.create({name, email, password, picture});
        res.status(201).json(user);
    } catch (e) {
    let msg;
    if(e.code == 11000){
        msg = "User already exists Login instead"
    } else {
        msg = e.message;
    }
    console.log(e);
    res.status(400).json(msg)
    }
})

//login user

router.post('/login', async(req, res)=> {
    try {
        const {email, password} = req.body;
        const user = await User.findByCredentials(email, password);
        user.status = 'online';
        await user.save();
        res.status(200).json(user);
    } catch (e) {
        res.status(400).json(e.message)
    }
})

//getting all users
router.get('/users',async(req,res)=>{
    const users = await User.find().sort({_id:"-1"}).exec()
    return res.status(200).json(users)
})

//delete a user
router.post('/users/:id',async(req,res)=>{
    try{
        const user = await User.findByIdAndRemove(req.params.id)
        if(!user) {return res.status(404).send("User not Found")}
        return res.status(200).json(user)
    }catch(e){
        console.log(e)
    }
})

//addAdmin
router.post('/admin/:id',async(req,res) =>{
    const user = await User.findById(req.params.id)
    if(user.isAdmin === 'false'){
        user.isAdmin = 'true';
        await user.save();
        res.status(200)
    }else{
        user.isAdmin = 'false';
        await user.save();
        res.status(200)
    }
})


module.exports = router