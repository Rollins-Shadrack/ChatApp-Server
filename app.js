const express = require('express')
const app = express();
const mongoose = require('mongoose')
const Messsage = require('./models/Message')
const rooms = ["General",'Bipolar Disorder','Post-Traumatic Stress  (PTSD)','Substance Abuse']
const cors = require('cors');
const Message = require('./models/Message');
const User = require('./models/User');
require("dotenv").config()

//setting up our database
mongoose.connect(process.env.DATABASE).then(()=>{console.log('mongodb connected')})


//Initializing body parser
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());

//setting up the routes
app.use('/users', require('./routes/user'))
app.use('/files', require('./routes/files'))
app.use('/posts', require('./routes/Posts'))

app.get('/rooms',(req,res)=>{
    res.json(rooms)
})

const server = require('http').createServer(app)
const PORT = process.env.PORT || 5000

const io = require('socket.io')(server, {
    cors: {
        origin: 'https://therapy-chat.netlify.app',
        methods: ['GET', 'POST']
    }
})

//getting previous messages
const getLastMessagesFromRoom = async(room) =>{
    let roomMessages = await Message.aggregate([
        {$match: {to: room}},
        {$group: {_id: '$date', messagesByDate: {$push: '$$ROOT'}}}
    ])
    return roomMessages
}

//sort messages by date
const sortRoomMessagesByDate = (messages) =>{
    return messages.sort((a, b)=>{
    let date1 = a._id.split('/');
    let date2 = b._id.split('/');

    date1 = date1[2] + date1[0] + date1[1]
    date2 =  date2[2] + date2[0] + date2[1];

    return date1 < date2 ? -1 : 1
})
}
//socket connection
io.on('connection',(socket)=>{

    //new user
    socket.on('new-user',async()=>{
        const members = await User.find()
        //emit to all the users by io
        io.emit('new-user',members)
    })


    //Joining a room
    socket.on('join-room',async(newRoom,previousRoom)=>{
        socket.join(newRoom);
        socket.leave(previousRoom);
        let roomMessages = await getLastMessagesFromRoom(newRoom)
        roomMessages = sortRoomMessagesByDate(roomMessages)

        //send it back to the client
        socket.emit('room-messages', roomMessages)
    })

    //messages
    socket.on('message-room', async(room,content, sender, time, date)=>{
        // console.log("new Message", content)
        const newMessage = await Message.create({content, from: sender, time, date, to: room});
        let roomMessages = await getLastMessagesFromRoom(room)
        roomMessages = sortRoomMessagesByDate(roomMessages)
        //sending messages to the room
        io.to(room).emit('room-messages', roomMessages)

        //users who are not online should receive a message
        socket.broadcast.emit('notifications', room)
    })
    app.delete('/logout', async(req, res)=> {
        try {
            const {_id, newMessages} = req.body;
            const user = await User.findById(_id);
            user.status = "offline";
            user.newMessages = newMessages;
            await user.save();
            const members = await User.find();
            socket.broadcast.emit('new-user', members);
            res.status(200).send();
            } catch (e) {
            console.log(e);
            res.status(400).send()
            }
        })
})

server.listen(PORT, ()=>{
    console.log(`server connected at port ${PORT}`)
})