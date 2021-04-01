const express = require('express')
const app = express()

const serverURL = 'http://localhost'
const port = process.env.PORT || 5000

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Server listening at ${serverURL}:${port}`)
})
