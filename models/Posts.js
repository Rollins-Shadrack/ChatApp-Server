const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types

const postSchema = new mongoose.Schema({
    caption:{
        type:String,
        required:true
    },
    picture:{
        type:String
    },
    poster:{
        type:String,
        required:true
    },
    anonymous:{
        type:String
    },
    comments:[{
        text: String,
        postedBy:{type:ObjectId,ref:"User"}
    }],
    likes:[{type:ObjectId,ref:"User"}]
})

const Posts = mongoose.model('Posts',postSchema);
module.exports.Posts = Posts;