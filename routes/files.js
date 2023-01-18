const mongoose = require('mongoose');
const GridFsStorage = require('multer-gridfs-storage').GridFsStorage
const router = require('express').Router();
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const Grid = require('gridfs-stream')
require('dotenv').config();
//database
const MongoURI = process.env.DATABASE;

//create connection
const conn = mongoose.createConnection(MongoURI,{
    useNewUrlParser: true,
    useUnifiedTopology: true
},()=>{console.log("image database connected")});

let gfs;
conn.once('open',() =>{
        // Init stream
        gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
            bucketName: 'images'
        })
        gfs = Grid(conn.db, mongoose.mongo);  
        gfs.collection('images');
})

const storage = new GridFsStorage({
    url:MongoURI,
    options: { useUnifiedTopology: true },
    file: (req,file) =>{
        return new Promise((resolve,reject)=>{
            crypto.randomBytes(16,(err,buf) =>{
                if(err){
                    return reject(err)
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo ={
                    filename:filename,
                    bucketName:"images"
                };
                resolve(fileInfo)
            })
        })
    }
})
const store = multer({
    storage,
    limits:{fileSize: 20000000},
    fileFilter: function (req,file,cb){
        checkFileType(file,cb)
    }
})

const checkFileType = (file,cb) =>{
    const filetypes = /jpeg|jpg|png|gif/
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb('filetype');
}
const uploadMiddleware = (req,res,next) =>{
    const upload = store.single('image');
    upload(req,res,(err) =>{
        if(err instanceof multer.MulterError){
            return res.status(400).send('File too large');
        }else if (err) {
            if (err === 'filetype') return res.status(400).send('Image files only');
            return res.sendStatus(500);
        }
        next()
    })
}
router.post('/profile_picture',uploadMiddleware, async(req,res)=>{
    const {file} = req;
    res.status(200).json(file.filename)

})


//displaying the actual image
router.get('/:filename',async(req,res) =>{
    try{
        gfs.files.findOne({filename:req.params.filename},(err,file)=>{
            if(!file || file.length === 0){
                return res.status(404).json({
                    err:'no file'
                })
            }
            const readStream = gridfsBucket.openDownloadStream(file._id);
            readStream.pipe(res)
        })
    }catch(err){
        console.log(err)
    }
})

const deleteImage = (id) => {
    if (!id || id === 'undefined') return res.status(400).send('no image id');
    const _id = new mongoose.Types.ObjectId(id);
    gfs.delete(_id, (err) => {
    if (err) return res.status(500).send('image deletion error');
});
};

module.exports = router
