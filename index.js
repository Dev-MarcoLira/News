require('dotenv').config()
const fileUpload = require('express-fileupload')
const fs = require('fs')
const express = require('express')
const app = express()
const path = require("path")
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const USER = process.env.USER
const PASSWORD = process.env.PASSWORD
const PORT = 3000
const HOST = process.env.HOST

const uri = `mongodb+srv://${USER}:${PASSWORD}@cluster1.kowtsmr.mongodb.net/dankicode?retryWrites=true&w=majority&appName=Cluster1`
const Posts = require('./schemas/Posts')

const session = require('express-session')


mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('Connected')
}).catch((err)=>{
    console.log(err.message)
})

app.use(session({
    secret: 'keyboard cat',
    cookie: { maxAge: 6000000 }
}))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')
app.use('/public', express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, '/pages'))

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'temp')
}))

const users = JSON.parse(process.env.ADMIN_USERS)

app.get('/admin/news', (req,res)=>{

    Posts.find({}).sort({ '_id': -1 }).exec()
        .then(posts => {
    
            posts = posts.map(post => {

                return{
                    id: post._id,
                    title: post.title,
                    category: post.category,
                    body: post.body.substring(0, 100) + '...',
                    views: post.views,
                    image: post.image,
        //            slug: post.slug
                }

            })
            
            res.render('admin-news', { posts })
            
        })

})

app.post('/admin/news', (req,res)=>{

    //Uploading files

    const [ name, extension ] = req.files.image_file.name.split('.')
    const allowedExtensions = [ 'jpg', 'jpeg', 'png' ]
    
    if(allowedExtensions.includes(extension) ){
        
        const date = new Date().getTime()

        const image_url = `${name}-${date}.${extension}`
        req.files.image_file.mv(__dirname+'/public/uploads/'+ image_url)

        //Inserting Post in the Database

        Posts.create({

            title: req.body.title,
            image: `${process.env.HOST}${image_url}`,
            category: req.body.category,
            body: req.body.body,
            slug: req.body.slug,
            author: req.body.author,
            views: 0

        })

    }else{
        fs.unlinkSync(req.files.image_file.tempFilePath)
        console.log('Unsuported File Extension.')
    }

    res.redirect('/admin/news')
    
})

app.get('/admin/news/delete/:id', (req,res)=>{

    Posts.deleteOne({ _id: req.params.id })
        .then(()=>{

            res.redirect('/admin/news')
        })
        .catch(err=>{
            console.log(err.message)
        })


})

app.post('/admin/login', (req, res) => {

    const login = req.body.login
    const password = req.body.password

    users.forEach(user=>{
        if(user.login == login && user.password == password){
            req.session.login = login
        }
    })

    
    res.redirect('/admin/login')
})

app.get('/admin/login', (req, res)=>{

    if(!req.session.login){
        
        res.render('admin-login')
        
    }else{
        res.render('admin-panel')
    }


})


app.get('/', (req, res) => {

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
