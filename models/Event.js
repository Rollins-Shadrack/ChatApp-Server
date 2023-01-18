const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    link:{
        type:String,
        required:true
    },
    about:{
        type:String
    }
})
const Event = mongoose.model('Events',eventSchema)
module.exports.Event = Event