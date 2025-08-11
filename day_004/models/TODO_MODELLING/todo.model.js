import mongoose from "mongoose";

const todoSchema = mongoose.Schema({
    heading : {type : String,
        required : true},
    
    desc : {
        type : String,
        required : true
    },

    colurTag : {
        type : String,
        enum : [ "black" ,"red","green","blue","yellow"],
        default : "black"
    },

    createdBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },

    subTodos : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Subtodo"
        }
    ]  
},
  {timestamps : true}
);


export const Todo = mongoose.model("Todo",todoSchema);