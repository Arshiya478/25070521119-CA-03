const express = require('express')
const cors = require('cors')
const { MongoClient, ObjectId } = require('mongodb')
require('dotenv').config()

const app = express()
const port = Number(process.env.PORT || 5000)
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017')
let medicines

app.use(cors())
app.use(express.json())

function validId(id) { return ObjectId.isValid(id) }
function cleanMedicine(body) {
  return {
    medicineName: String(body.medicineName || '').trim(),
    dosage: String(body.dosage || '').trim(),
    time: String(body.time || '').trim(),
    frequency: String(body.frequency || 'Daily').trim(),
    startDate: body.startDate || '',
    endDate: body.endDate || '',
    enabled: body.enabled !== false,
    updatedAt: new Date()
  }
}

app.get('/api/health', (req,res)=>res.json({ok:true, service:'Medicine Reminder API'}))
app.get('/api/medicines', async (req,res)=>{
  try { res.json(await medicines.find().sort({time:1,createdAt:-1}).toArray()) }
  catch(e){ res.status(500).json({message:'Could not retrieve medicines',error:e.message}) }
})
app.get('/api/medicines/:id', async (req,res)=>{
  try { if(!validId(req.params.id)) return res.status(400).json({message:'Invalid medicine id'}); const item=await medicines.findOne({_id:new ObjectId(req.params.id)}); if(!item)return res.status(404).json({message:'Medicine not found'}); res.json(item) }
  catch(e){res.status(500).json({message:e.message})}
})
app.post('/api/medicines', async (req,res)=>{
  try { const item=cleanMedicine(req.body); if(!item.medicineName||!item.dosage||!item.time)return res.status(400).json({message:'Medicine name, dosage and time are required'}); item.createdAt=new Date(); const result=await medicines.insertOne(item); res.status(201).json({...item,_id:result.insertedId}) }
  catch(e){res.status(500).json({message:'Could not create medicine',error:e.message})}
})
app.put('/api/medicines/:id', async (req,res)=>{
  try { if(!validId(req.params.id))return res.status(400).json({message:'Invalid medicine id'}); const item=cleanMedicine(req.body); if(!item.medicineName||!item.dosage||!item.time)return res.status(400).json({message:'Medicine name, dosage and time are required'}); const result=await medicines.updateOne({_id:new ObjectId(req.params.id)},{$set:item}); if(!result.matchedCount)return res.status(404).json({message:'Medicine not found'}); res.json({message:'Medicine updated',...item,_id:req.params.id}) }
  catch(e){res.status(500).json({message:'Could not update medicine',error:e.message})}
})
app.delete('/api/medicines/:id', async (req,res)=>{
  try { if(!validId(req.params.id))return res.status(400).json({message:'Invalid medicine id'}); const result=await medicines.deleteOne({_id:new ObjectId(req.params.id)}); if(!result.deletedCount)return res.status(404).json({message:'Medicine not found'}); res.json({message:'Medicine deleted'}) }
  catch(e){res.status(500).json({message:'Could not delete medicine',error:e.message})}
})

async function start(){
  try {
    await client.connect()
    const db=client.db(process.env.DB_NAME || 'medicineReminderDB')
    medicines=db.collection('medicines')
    await medicines.createIndex({time:1})
    app.listen(port,()=>console.log(`Medicine Reminder API running at http://localhost:${port}`))
    console.log(`MongoDB connected: ${db.databaseName}.medicines`)
  } catch(e) { console.error('MongoDB connection failed:',e.message); process.exit(1) }
}
start()
