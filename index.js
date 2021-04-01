import express from 'express'
import dotenv from 'dotenv'
import { connectDB } from './db.js'

dotenv.config()
const app = express()

connectDB() // connect database

const serverURL = 'http://localhost'
const port = process.env.PORT || 5000

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Server listening at ${serverURL}:${port}`)
})
