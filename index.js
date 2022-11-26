const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
        app.get('/product/:id', async(req, res) =>{
            const category_id = req.params.id;
            const query = {category_id: category_id};
            const product = await productCollection.find(query).toArray();
            res.send(product);
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
