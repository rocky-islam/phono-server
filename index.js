const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
require('dotenv').config();

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

        // find my product
        app.get('/myproduct', async(req, res) => {
            const email = req.query.email;
            const query = { sellerEmail: email };
            const myproduct = await productCollection.find(query).toArray();
            res.send(myproduct);
        });

        // add user in database
        app.post('/users', async(req, res) =>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
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
