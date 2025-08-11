// // step 1 : import mongoose
// import mongoose  from "mongoose";

// // step  2 : create schema
// const subtodo = new mongoose.Schema({
    
// });


// // step 3 : export model 
// export const Subtodo = mongoose.model("Subtodo",subtodo);   // Note : in mongodb is "Subtodo" will become "subtodos" it is done by mongodb


// we will learn various models so it become easy for us to know how we modelling data and schema

// =================== // =======================//

// step 1 : import mongoose
import mongoose  from "mongoose";

// step  2 : create schema
const subtodoSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true
    },
    desc :{
        type : String,
        required : true
    },
    isCompleted : {
        type : Boolean,
        default : false
    },
   colourTag :{
    type : String,
    enum : ["black","red","green","blue","yellow"],
    default : "black"
   }  ,
   createdBy :{
     type : mongoose.Schema.Types.ObjectId,
     ref : "User"
   }

},
{timestamps : true}
);


// // step 3 : export model 
export const Subtodo = mongoose.model("Subtodo",subtodoSchema);   // Note : in mongodb is "Subtodo" will become "subtodos" it is done by mongodb