import mongoose from "mongoose";

const connectDB = async () => {
  try {
      mongoose.connection.on("connected", () => console.log("MongoDB connected successfully"));
     await mongoose.connect(`${process.env.MONGOGB_URL}/socialmediaapp`);  
  }catch (error) {
          console.log(error.message);
  } 
}

export default connectDB;