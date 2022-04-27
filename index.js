const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const admin = require("firebase-admin");

const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;
 

//  firebase token 

const serviceAccount = require("./fresh-food-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tlqgi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, });


async function verifyToken(req, res, next){
    if(req.headers?.authorization?.startsWith('Bearer ')){
        const token = req.headers.authorization.split(' ')[1];

        try{
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email

        }catch{

        }

    }
    next();
}


async function run(){
    try{
        await client.connect();
        console.log('Database connection successfully')
        const database = client.db('fresh_food');
        const productCollection = database.collection('products');
        const orderCollection = database.collection('orders');
        const usersCollection = database.collection('users');
        const reviewsCollection = database.collection('review')
        //GET API Products
        // app.get('/products', async(req, res) => {
        //     const cursor = productCollection.find({});
        //     const products = await cursor.toArray();
        //     res.send(products)
        // })

        // Add Products API
        app.post('/products', async(req, res) => {
            
            const product = req.body;
            console.log('hit the api', product);
            const result = await productCollection.insertOne(product);
            console.log(result);
            res.json(result)
        });

        // GET API All Products
        app.get('/products', async(req, res) => {
            const cursor = productCollection.find({});
            const products = await cursor.toArray();
            res.json(products);
        });

        // Get Api Single Data 
        app.get('/products/:id', async(req, res) => {
            const id = req.params.id;
            // console.log(id)
            const query = { _id: ObjectId(id) }
            const product = productCollection.findOne(query);
            res.json(product)
        });

        // Product order Post API
        app.post('/orders', async(req, res) => {
            const order = req.body;
            // console.log('order my products', order);
            const result = await orderCollection.insertOne(order);
            res.json(result);
        });
 
         //my order GET API
         app.get('/orders/:email', async(req, res) => {
            // console.log(req?.params?.email)
            const email = req?.params?.email;
            const query = {email: email}
            const result = await orderCollection.find(query).toArray()
            console.log(result);
            res.json(result);
          });

          // Delete An Order
          app.delete('/order/delete/:id', async(req, res) => {
              const id = req.params.id;
              console.log(id)
              const query = { _id: ObjectId(id) }
              const result = await orderCollection.deleteOne(query);
              console.log(result)
              res.json(result);
          });

          //Users POST API
          app.post('/users', async(req, res) => {
              const user = req.body;
              const result = await usersCollection.insertOne(user);
              console.log(result);
              res.json(result);
          });

          // UPDATE AN USER PUT API
          app.put('/users', async(req, res) => {
              const user = req.body;
            //   console.log('Put', user)
              const filter = {email: user.email};
              const options = { upsert: true };
              const updateDoc = { $set: user };
              const result = await usersCollection.updateOne(filter, updateDoc, options);
              res.json(result);
          });

          // User Role Admin PUT API
          app.put('/users/admin', verifyToken, async(req, res) => {
              const user = req.body;
              console.log('Put', )
              const requester = req.decodedEmail;

              if(requester){
                  const requestAccount = await usersCollection.findOne({email: requester})
                  if(requestAccount.role === "admin"){
                    const filter = {email: user.email}
                    const updateDoc = {$set: {role: 'admin'}}
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result)
                  }
              }
              else{
                  res.status(401).json({message: 'You do not have access make admin'})
              } 
              
          })
          // User Role Admin Check GET API
          app.get('/users/:email', async(req, res) => {
              const email = req.params.email;
              const query = {email: email};
              let isAdmin = false;
              const user = await usersCollection.findOne(query);
              if(user?.role === 'admin'){
                  isAdmin = true
              }
              res.json({ admin: isAdmin})
          })
          // Manage ALL Order GET API
          app.get('/orders', async(req, res) => {
              const cursor = orderCollection.find({});
              const orders = await cursor.toArray();
              res.json(orders);
          })
          
          // Manage ALL ORDER DELETE API
          app.delete('/order/delete/:id', async(req, res) => {
              const id = req.params.id;
            //   console.log(id);
              const query = { _id: ObjectId(id)}
              const result = await orderCollection.deleteOne(query);
            //   console.log(result);
              res.json(result);
          });

          // REVIEW POST API
          app.post('/review', async(req, res) => {
              const review = req.body;
              const result = await reviewsCollection.insertOne(review)
            //   console.log(result);
              res.json(result)
          });

          // REVIEW POST API
          app.get('/reviews', async(req, res) => {
              const cursor = reviewsCollection.find({})
              const result = await cursor.toArray();
              res.json(result);
          })

          // UPDATE ORDER STATUS PUT API
          app.put('/order/status/:id', async(req, res) => {
            const id = req.params.id;
            const updateInfo = req.body;
            const result = await orderCollection.updateOne(
              { _id: ObjectId(id) },
              { $set: { status: updateInfo.status } }
            );
            res.send(result);
          })






    }
    finally{
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/',(req, res) => {
    res.send('Hello world');
})

app.listen(port, () => {
    console.log(`My listening port number ${port}`)
})



// heroku link
// https://limitless-shore-74822.herokuapp.com/