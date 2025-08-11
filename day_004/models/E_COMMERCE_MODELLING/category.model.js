import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
    name : {
        type : String,
        required : true
    },
   desc :{
     type : String,
     required : true
   },
   products : [
    {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Product"
    }
   ]
},{
    timestamps : true
})

export const Category = mongoose.model("Category",categorySchema);