require('dotenv').config()
const express = require('express')
const app = express()
const path = require("path")
const bodyParser = require('body-parser')
const PORT = 3000
const mongoose = require('mongoose')

const USER = process.env.USER
const PASSWORD = process.env.PASSWORD

const uri = `mongodb+srv://${USER}:${PASSWORD}@cluster1.kowtsmr.mongodb.net/dankicode?retryWrites=true&w=majority&appName=Cluster1`
const Posts = require('./schemas/Posts')


mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('Connected')
}).catch((err)=>{
    console.log(err.message)
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')
app.use('/public', express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, '/pages'))

app.get('/', async(req, res) => {

    const search = req.query.search

    if(!search){
        
        Posts.find({}).sort({ '_id': -1 }).exec()
            .then(posts => {
        
                posts = posts.map(post => {

                    return{
                        title: post.title,
                        category: post.category,
                        body: post.body.substring(0, 100) + '...',
                        image: post.image,
                        slug: post.slug
                    }

                })


                Posts.find({}).sort({ 'views': -1 }).limit(3).exec()
                    .then(bestReadPosts =>{
                         bestReadPosts = bestReadPosts.map(post => {

                            return{
                                title: post.title,
                                category: post.category,
                                body: post.body.substring(0, 100) + '...',
                                image: post.image,
                                slug: post.slug
                            }
                        })

                        res.render('home.html', { posts, bestReadPosts })
                    })
                    .catch(err=>{
                        console.log(err.message)
                    })


                
            })
            .catch(err => {
                console.log(err.message)
            })
        
    }else{


        const search = req.query.search

        Posts.find({ title: { $regex: search, $options:  'i'} })
            .then(posts => {
                

                posts = posts.map(post => {

                    return{
                        title: post.title,
                        category: post.category,
                        body: post.body.substring(0, 300) + '...',
                        image: post.image,
                        slug: post.slug
                    }
                })

                
                Posts.find({}).sort({ 'views': -1 }).limit(3).exec()
                    .then(bestReadPosts =>{
                         bestReadPosts = bestReadPosts.map(post => {

                            return{
                                title: post.title,
                                category: post.category,
                                body: post.body.substring(0, 100) + '...',
                                image: post.image,
                                slug: post.slug
                            }
                        })

                        res.render('search.html', { posts, bestReadPosts })
                    })
                    .catch(err=>{
                        console.log(err.message)
                    })




            })
            .catch(err => {
                console.log(err.message)
            })


    }

})

app.get('/:slug', ( req, res) => {
    
    const slug = req.params.slug

    Posts.findOneAndUpdate({ slug }, { $inc: { views: 1 } }, { new: true } )
        .then(post => {
            
            if(post){
            
                Posts.find({}).sort({ 'views': -1 }).limit(3).exec()
                .then(bestReadPosts =>{
                        bestReadPosts = bestReadPosts.map(post => {

                        return{
                            title: post.title,
                            category: post.category,
                            body: post.body.substring(0, 100) + '...',
                            image: post.image,
                            slug: post.slug
                        }
                    })

                    res.render('single.html', { post, bestReadPosts })
                })
                .catch(err=>{
                    console.log(err.message)
                })

            }else{

                res.redirect('/')

            }

        })
        .catch(err=>{
            console.log(err.message)
        })

})

app.listen(PORT, () => { console.log('Listening') })