const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const { v4: uuid } = require('uuid')
const { PrismaClient } = require('@prisma/client')
const {
    uploadObject,
    deleteObject,
    getObjectSignedUrl,
} = require('./utils/s3')

require('dotenv').config()

const app = express()
const prisma = new PrismaClient()

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


app.get('/', (req, res) => {
    res.status(200).send('Welcome to the Jungle')
})

app.use(express.json())

app.get('/api/posts', async(req, res) => {
    try {
        const posts = await prisma.posts.findMany({
            orderBy: [{
                created: 'desc'
            }]
        })
        for (let post of posts){
            post.imageUrl = await getObjectSignedUrl(post.imageName)
        }
        res.status(200).json({
            posts
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: error.message
        })
    }
})

app.post('/api/posts', upload.single('image'), async (req, res) => {
    try {
        const file = req.file
        const caption = req.body.caption
        const imageName = file.originalname + '-' + uuid() + file.originalname.split('.')[1]
        
        const response = await uploadObject(file.buffer, imageName, file.mimetype)
        console.log('aws response\t:', response)
        const post = await prisma.posts.create({
            data: {
                imageName,
                caption
            }
        })
        console.log('Post created\t:', post)
        
        res.status(201).json({
            post
        })
    } catch (error) {
        console.log('Error\t:', error)
        res.status(500).json({
            error: error.message
        })
    }
})

app.delete('/api/posts/:id', async(req, res) => {
    const id = +req.params.id
    try {
        const post = await prisma.posts.findUnique({
            where: {
                id: id
            }
        })
        await deleteObject(post.imageName)
        await prisma.posts.delete({
            where: {
                id: post.id
            }
        })
        res.sendStatus(204)
    } catch (error) {
        res.sendStatus(500)
    }
})

app.post('/api/posts/delete', async(req, res) => {
    try {
        const response = await prisma.posts.findMany()
        for(let i=0; i<response.length; i++){
            const imageName = response[i].imageName
            const deleteObj = await deleteObject(imageName)
            const deletePost = await prisma.posts.delete({
                where: {
                    id: response[i].id
                }
            }) 
        }
        res.sendStatus(204) 
    } catch (error) {
        console.log(error)
        res.sendStatus(500)

    }
})



app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`)
})