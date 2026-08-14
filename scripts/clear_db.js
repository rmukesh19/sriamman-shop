import "dotenv/config";
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://mdharixtechsolutions_db_user:Cr1l9ZsSCldtfHZP@cluster0.prsqwyc.mongodb.net/sriamman?retryWrites=true&w=majority&appName=Cluster0";

async function clearMongo() {
  console.log("Connecting to MongoDB Atlas at:", MONGO_URI);
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected!");
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    console.log(`Clearing collection: ${collection.collectionName}`);
    await collection.deleteMany({});
  }
  console.log("🟢 All MongoDB collections cleared successfully!");
  await mongoose.disconnect();
}

clearMongo().catch(err => {
  console.error("Error clearing Mongo:", err);
  process.exit(1);
});
