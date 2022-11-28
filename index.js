const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
const { query } = require('express');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());


// Mongodb connect
// user name: phonoDb
// password: dMm6WnPgmejtuK6B


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bhp2qs5.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// jwt function
function verifyJWT(req, res, next){
    // console.log("token inside VerifyJWT", req.headers.authorization);
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })

}



async function run(){
    try{
        const catProductCollection = client.db('phono').collection('catProduct');
        const productCollection = client.db('phono').collection('product');
        const categoryCollection = client.db("phono").collection("categories");
        const buyItemCollection = client.db('phono').collection('buyItem');
        const usersCollection = client.db('phono').collection('users');
        
        // catProduct (product + category) in one database
        app.get('/catProduct', async(req, res) =>{
            const query = {};
            const options = await catProductCollection.find(query).toArray();
            res.send(options);
        })
        app.get('/catProduct/:id', async(req, res) =>{
            const id =req.params.id;
            const query = {_id: ObjectId(id)};
            const options = await catProductCollection.findOne(query);
            res.send(options);
        });


        // category collection
        app.get('/category', async(req, res)=>{
            const query = {};
            const category = await categoryCollection.find(query).toArray();
            res.send(category);
        })

        // test single product collection
        app.get('/products/:id', async(req, res) =>{
            const category_id = req.params.id;
            const query = {category_id: category_id};
            const products = await productCollection.find(query).toArray();
            res.send(products);
        });

        // Get single Product from productCollection
        app.get('/product/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const product = await productCollection.findOne(query);
            res.send(product);
        });

        // post data to buyItem collection
        app.post('/buyitem', async(req, res) =>{
            const buyItem = req.body;
            // console.log(buyItem);
            const result = await buyItemCollection.insertOne(buyItem);
            res.send(result)
            
        });

        // get data from by item
        app.get('/buyitem', async(req, res) =>{
            const email= req.query.email;
            const query = {email: email};
            const result = await buyItemCollection.find(query).toArray();
            res.send(result);
        })

        // get all buy items
        app.get('/buyitems/:id', async(req, res) =>{
            const id= req.params.id;
            const query={_id: ObjectId(id)};
            const result = await buyItemCollection.findOne(query);
            res.send(result);
        })



        // using jwt here
        // find my product
        app.get('/myproduct',verifyJWT, async(req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if(email !== decodedEmail){
                return res.status(403).send({message: 'forbidden access'})
            }
            // console.log('token', req.headers.authorization);
            const query = { sellerEmail: email };
            const myproduct = await productCollection.find(query).toArray();
            res.send(myproduct);
        });

        
        // add user in database
        app.post('/users', async(req, res) =>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });



        // stripe payment
        app.post("/create-payment-intent", async (req, res) => {
          const item = req.body;
          const price = item.price;
          const amount = price * 100;

          const paymentIntent = await stripe.paymentIntents.create({
            currency: "usd",
            amount: amount,
            payment_method_types: ["card"],
          });
          res.send({
            clientSecret: paymentIntent.client_secret,
          });
        });







        // jwt token here
        app.get('/jwt', async(req, res) =>{
            const email = req.query.email;
            const query = {email: email}
            const user = await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {expiresIn: '1d'});
                return res.send({accessToken: token})
            }
            // console.log(user);
            res.status(403).send({accessToken: 'token'})
            
        })

        // insert product
        app.post('/addproduct', async(req, res) =>{
            const addProduct = req.body;
            // console.log(addProduct);
            const result = await productCollection.insertOne(addProduct);
            res.send(result)
        })

        // find all seller
        app.get('/seller', async(req, res) =>{
            // const role = req.query.role;
            const query = {role: 'seller'};
            const user = await usersCollection.find(query).toArray();
            res.send(user);
        })

        // verify seller start
        app.put('/seller/verify/:id', async(req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id), role: 'seller'};
            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    verify: 'verified'
                }
            }
            const result =await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        // verify seller end

        // all buyer
        app.get('/buyer', async(req, res) =>{
            // const role = req.query.role;
            const query = {role: 'buyer'};
            const user = await usersCollection.find(query).toArray();
            res.send(user);
        })

        // set admin roll
        app.get('/users/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.role === 'admin'});
        })


        // set seller roll
        app.get('/users/seller/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query);
            res.send({isSeller: user?.role === 'seller'});
        })


        // Delete Buyer
        app.delete('/buyer/:id', async(req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })


    }
    finally{

    }
}
run().catch(error => console.log(error))



app.get('/', async(req, res) => {
    res.send('Phono website server is running');
});


app.listen(port, () => console.log(`Phono is Running on port: ${port}`))
