require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

app.use(cors({
  origin:
    [
      'http://localhost:5173',
      'https://digitalsheba.netlify.app',
      'https://digital-sheba.surge.sh'
    ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


// middleware to verify jwt token
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized accsess' })
  }
  jwt.verify(token, process.env.JSON_ACCESS_SECRET_TOKEN, (err, decodded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized accsess' })
    }
    req.user = decodded;
    next();
  })
}


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
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // created service collection
    const serviceCollection = client.db('servicesDB').collection('services');


    // created service booking collection
    const bookingCollection = client.db('bookingDB').collection('booking');


    // testimonial collection
    const testimonialColection = client.db('testimonialDB').collection('testimonial');


    // auth related APIs

    // create a jwt token
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JSON_ACCESS_SECRET_TOKEN, {
        expiresIn: '5h'
      })

      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          // secure: false, // for localhost
        })
        .send({ sucsess: true })
    })


    // clear jwt token when user will log-out
    app.post('/remove-token', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          // secure: false, // for localhost
        })
        .send({ succsess: true })
    })


    // get all services
    app.get('/services', async (req, res) => {
      const searchParams = req.query.searchParams;
      let query = {};
      if (searchParams) {
        query = { service: { $regex: searchParams, $options: "i" } }
      }
      const limit = parseInt(req.query.limit) || 0;
      const result = await serviceCollection.find(query).limit(limit).toArray();
      res.send(result)
    })


    // manage services api
    app.get('/manage-services', verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { provider_email: email };
      if (req.user?.email !== email) {
        return res.status(403).send({ message: 'Forbidden accsess' })
      }
      const result = await serviceCollection.find(query).toArray();
      res.send(result);
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
      const query = { _id: new ObjectId(id) }
      const result = await serviceCollection.findOne(query);
      res.send(result);
    })


    // add booking info to DB
    app.post('/services/booking', async (req, res) => {
      const newBookingService = req.body;
      const result = await bookingCollection.insertOne(newBookingService);
      res.send(result);
    })


    // delete a specific service
    app.delete('/services/:service', async (req, res) => {
      const service = req.params.service;
      const query = { _id: new ObjectId(service) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    })


    // update service
    app.patch('/service/:id', async (req, res) => {
      const newService = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedService = {
        $set: newService
      }
      const result = await serviceCollection.updateOne(query, updatedService, options);
      res.send(result);

    })


    // get all booked services booked by a user
    app.get('/booked/services', verifyToken, async (req, res) => {
      const user = req.query.user;
      const provider = req.query.provider;
      const query = {};
      if (user) {
        if (req.user?.email !== user) {
          return res.status(403).send({ message: 'Forbidden accsess' })
        }
        query.userEmail = user;
      }
      else {
        if (req.user?.email !== provider) {
          return res.status(403).send({ message: 'Forbidden accsess' })
        }
        query.providerEmail = provider;
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })


    // update status
    app.patch('/booked-service/update-status/:id', async (req, res) => {
      const { serviceStatus } = req.body;
      const bookedServiceId = req.params.id;
      const query = { _id: new ObjectId(bookedServiceId) };
      const updatedStatus = {
        $set: { serviceStatus }
      }
      const result = await bookingCollection.updateOne(query, updatedStatus);
      res.send(result);
    })

    
    // add testimonial
    app.post('/add-testimonial', async (req, res) => {
      const testimonial = req.body;
      const result = await testimonialColection.insertOne(testimonial);
      res.send(result);
    })


    // get testimonials
    app.get('/testimonials', async (req, res) => {
      const result = await testimonialColection.find().toArray();
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
  // console.log(`server is running at post ${port}`);
})