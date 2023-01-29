const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const jwt=require('jsonwebtoken')
const app =express()
const port =process.env.PORT|| 5000;

app.use(cors())
app.use(express.json())

app.get('/', (req, res)=>{
    res.send('volenter network server running')
})


const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Password}@cluster0.vxj4bij.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJwt(req, res, next){
     const authHeaders= req.headers.authorization;
     if(!authHeaders){
       return res.status(401).send({message: 'unauthorized access' })
     }
     const token =authHeaders.split(' ')[1];
     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
         if(err){
           return  res.status(403).send({message: 'unauthorized access'})
         }
         req.decoded=decoded;
         next()
     })
}
async function run(){
    try{
        const servicesCollection= client.db('volenter').collection('services');
        const ordercollection= client.db('volenter').collection('orders')
         app.post('/jwt', (req, res)=> {
             const user=req.body;
             const token=jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'});
             res.send({token})
         })
        app.get('/services' ,async (req , res)=>{
           const query={};
           const cursor= servicesCollection.find(query);
           const result= await cursor.toArray()
           res.send(result)

        });
        app.get('/services/:id', async(req, res)=>{
            const id =req.params.id;
            const query={_id: ObjectId(id)};
            const service= await servicesCollection.findOne(query);
            res.send(service)
        })
        // orders api
        app.get('/orders', verifyJwt, async(req, res)=>{
            const decoded=req.decoded;
            
             if(decoded.email !== req.query.email){
                res.status(403).send({message: 'unautorization access'})
             }
            let query= {};
            if(req.query.email){
                query= {
                    email: req.query.email,
                }
            }
            const cursor= ordercollection.find(query);
            const order= await cursor.toArray();
            res.send(order)
        })
        // create opatration
        app.post('/orders',verifyJwt, async(req,res)=>{
            const order= req.body;
            const result= await ordercollection.insertOne(order);
            res.send(result)
        })
        // orders update
        app.patch('/orders/:id',verifyJwt, async(req, res)=>{
            const id =req.params.id;
            const status=req.body.status;
            const query={_id: ObjectId(id)};
            const updateDoc={
                $set: {
                    status: status,
                }
            }
            const result= await ordercollection.updateOne(query, updateDoc);
            res.send(result)
        })
        //delete oparation 
        app.delete('/orders/:id',verifyJwt, async(req, res)=> {
            const id =req.params.id;
            const query={_id: ObjectId(id)};
            const result= await ordercollection.deleteOne(query);
            res.send(result)

        })

        

    }
    finally{

    }
}
run().catch(e => console.error(e))

app.listen(port, ()=> {
    console.log(`volenter network server running port ${port}`)
})