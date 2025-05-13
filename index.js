const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());


// mongodb connection


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.orsq4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // created service collection
    const serviceCollection = client.db('servicesDB').collection('services');


    // created service booking collection
    const bookingCollection = client.db('bookingDB').collection('booking');


    // all APIs

    // get all services
    app.get('/services', async (req, res) => {
        const services = req.body;
        const limit = parseInt(req.query.limit) || 0;
        const result = await serviceCollection.find(services).limit(limit).toArray();
        res.send(result)
    })


    // add service to DB
    app.post('/add-service', async (req, res) => {
        const newService = req.body;
        const result = await serviceCollection.insertOne(newService);
        res.send(result);
    })


    // get a specific service
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await serviceCollection.findOne(query);
      res.send(result);
    })


    // add booking info to DB
    app.post('/services/booking', async (req, res) => {
      const newBookingService = req.body;
      const result = await bookingCollection.insertOne(newBookingService);
      res.send(result);
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



// create root api
app.get('/', (req, res) => {
    res.send('A 11 server running.....!')
})


app.listen(port, () => {
    console.log(`server is running at post ${port}`);
})