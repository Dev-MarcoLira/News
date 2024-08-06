require('dotenv').config()
const express = require('express')
const app = express()
const path = require("path")
const bodyParser = require('body-parser')
const PORT = 3000
const mongoose = require('mongoose')

const USER = process.env.USER
const PASSWORD = process.env.PASSWORD

const uri = `mongodb+srv://${USER}:${PASSWORD}@cluster1.kowtsmr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`

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

app.get('/', (req, res) => {

    const search = req.query.search

    if(!search){
        res.render('home.html')
    }else{
        res.render('search.html', {})
    }

})

app.get('/:slug', ( req, res) => {
    const slug = req.params.slug

    res.render('single.html', { slug })

})

app.listen(PORT, () => { console.log('Listening') })