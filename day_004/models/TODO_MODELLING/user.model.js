// // step 1 : import mongoose
import mongoose  from "mongoose";

// // step  2 : create schema
const userSchema = new mongoose.Schema(
    // first approach :
    // {
    //     email : String,
    //     username : String,
    //     name : String,
    //     password : String,
    //  }

    // second approach : industry standard
    {
        email : {
            type : String,
             unique  :true,
             lowercase : true,
              required : true  },

        username : {type : String,
             unique : true ,
             lowercase: true,
              required : true },
        
        fullName : {type : String,
             required : true },

        password : { type : String,
             required : [true , "password is must "] },

        avatar : { type : String,
             required : true },
        
        age : {
            type : Number,
            required : true,
            
        },
        todos : [
            {
                type : mongoose.Schema.Types.ObjectId,
                ref : "Todo"                
            }
        ]
      
            // check readme for more options available  for constraints 
    },
    {timestamps : true}  // this will give you two things createAt and  updatedAt

    //Note :
    // in mongodb _id already given so you dont need to give id  explicitely until you want to make your own custom one

);


// // step 3 : export model 
export const User = mongoose.model("User",userSchema);  
// Note : in mongodb is "User" will become "users" it is done by mongodb