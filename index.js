import express from 'express'
import dotenv from 'dotenv'
import { connectDB } from './db.js'

// app routes
import users from './routes/api/users.js'
import auth from './routes/api/auth.js'

dotenv.config()
const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

connectDB() // connect database

const serverURL = 'http://localhost'
const port = process.env.PORT || 5000

app.get('/', (_, res) => {
    res.send('API is running')
})

//defining routes
app.use("/api/users", users);
app.use("/api/auth", auth);

app.listen(port, () => {
    console.log(`Server listening at ${serverURL}:${port}`)
})
