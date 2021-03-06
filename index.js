import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { connectDB } from './db.js'

// app routes
import usersRoutes from './routes/api/users.js'
import authRoutes from './routes/api/auth.js'
import profileRoutes from './routes/api/profile.js'
import postsRoutes from './routes/api/posts.js'

dotenv.config()
const app = express()
app.use(cors({ origin: '*', credentials: true }))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

connectDB() // connect database

const serverURL = 'http://localhost'
const port = process.env.PORT || 5000

app.get('/', (_, res) => {
    res.send('API is running')
})

//defining routes
app.use("/api/users", usersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/posts", postsRoutes);

app.listen(port, () => {
    console.log(`Server listening at ${serverURL}:${port}`)
})
