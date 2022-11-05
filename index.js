const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config()

const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

console.log(process.env.DV_USER)

const uri = `mongodb+srv://${process.env.DV_USER}:${process.env.DV_PASSWORD}@cluster0.z1xe9fw.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const serviceCollection = client.db('geniusCar').collection('services')
        const orderCollection = client.db('geniusCar').collection('orders')

        function verifyJWT(req, res, next) {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).send({ message: 'unauthorized access' })
            }
            const token = authHeader.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
                if (err) {
                    return res.status(401).send({ message: 'Unauthorized access' })
                }
                req.decoded = decoded;
                next()
            })
        }

        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })
        app.get('/orders', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            console.log('inside orders api', decoded)
            if (decoded.email !== req.query.email) {
                return res.status(401).send({ message: 'Unauthorized access' })
            }
            let query = {}
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            console.log()

            const cursor = orderCollection.find(query)
            const orders = await cursor.toArray()
            res.send(orders)
        })
        app.post('/orders', verifyJWT, async (req, res) => {
            const order = req.body
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })

        app.delete('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })
        app.patch('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const status = req.body.status
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: status
                }
            }
            const result = await orderCollection.updateOne(query, updatedDoc);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})