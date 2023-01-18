const router = require('express').Router()
const { Posts } = require('../models/Posts')
const  User  = require('../models/User')
const {Event} = require('../models/Event')
const mongoose = require('mongoose')

//posting a post
router.post('/posts',async(req,res)=>{
    const data = req.body
    console.log(data)
    const newPost = new Posts(data)
    try{
        const savedPost = await newPost.save()
        if(savedPost){
            console.log("Post saved")
        }
        return res.status(200).json(savedPost)
    }catch(err){
        console.log(err)
    }
})
//getting all posts
router.get('/posts',async(req,res)=>{
    try{
        const posts = await Posts.find().sort({_id:"-1"}).exec()
        return res.json(posts)
    }catch(err){
        console.log(err)
    }
})

//getting the one who has posted a post
router.get("/poster/:id",async(req,res)=>{
    try{
        const poster = await User.findById(req.params.id);
        res.status(200).json(poster)
    }catch(e){
        console.log(e)
    }
})
// posting comments
router.put('/comments/:postId',async(req,res)=>{
    const comment = {
        text: req.body.comment,
        postedBy:req.body.commentedBy
    }
    Posts.findByIdAndUpdate(req.params.postId,{$push:{comments:comment}},{new:true}).populate("comments.postedBy"," name picture").exec((err,result)=>{
        if(err){
            return res.status(422).json({error:err})
        }
        res.status(200).json(result)
    })
})


//put like
router.post('/like/:postId/:likedBy',async(req,res)=>{
    try{
        const post =  await Posts.findById(req.params.postId)

        //check if the post has been liked 
        if(post.likes.filter(like => like.toString() === req.params.likedBy).length > 0){
            post.likes.remove(req.params.likedBy)
            await post.save()
            console.log("Post disliked")
            res.json(post.likes)
        }else{
            post.likes.unshift(req.params.likedBy)
            await post.save()
            console.log("post liked")
            res.json(post.likes)
        }
    }catch(err){
        console.error(err.message)
        res.status(500).send('server error')
    }
})



//delete a post
router.post('/posts/:id',async(req,res)=>{
    try{
        const post = await Posts.findByIdAndRemove(req.params.id)
        if(!post) {return res.status(404).send("Post not Found")}
        return res.status(200).json(post)
    }catch(e){
        console.log(e)
    }
})

//adding new Event
router.post('/event',async(req,res)=>{
    const newEvent = new Event(req.body)
    try{
        const savedEvent = await newEvent.save()
        if(savedEvent){
            console.log("Event saved")
        }
        return res.status(200).json(savedEvent)
    }catch(err){
        console.log(err)
    }
})

//getting all events
router.get('/event',async(req,res)=>{
    try{
        const events = await Event.find().sort({_id:"-1"}).exec()
        return res.status(200).json(events)
    }catch(err){
        console.log(err)
    }
})
//delete an event

router.post('/event/:id',async(req,res)=>{
    try{
        const event = await Event.findByIdAndRemove(req.params.id)
        if(!event) {return res.status(404).send("Post not Found")}
        return res.status(200).json(event)
    }catch(e){
        console.log(e)
    }
})

module.exports = router