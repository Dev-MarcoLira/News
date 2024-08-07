const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PostSchema = new Schema({ 

    title: String,
    image: String,
    category: String,
    body: String,
    slug: String,
    author: String,
    views: Number


 }, { collection: 'posts' })

 const Posts = mongoose.model('Posts', PostSchema, 'posts')

 module.exports = Posts