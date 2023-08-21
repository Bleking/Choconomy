const mongoose = require('mongoose')

const quizSchema = new mongoose.Schema({
    tag:{
        type : String,
        required:true
    },
    q:{
        type : String,
        required:true
    },
    a:{
        type : String,
        required:true
    },
    difficulty:{
        type:String,
        required: true
    },
    point:{
        type : Number,
        required:true
    } 
})
const sel_quizSchema = new mongoose.Schema({
    tag : {
        type : String, 
        required : true
    }, 
    q : {
        type : String, 
        required : true
    }, 
    a1 : {
        type : String, 
        required : true
    }, 
    a2 : {
        type : String, 
        required : true
    }, 
    a3 : {
        type : String, 
        required : true
    }, 
    a : {
        type : String, 
        required : true
    }, 
    point : {
        type : Number, 
        required : true
    }, 
})

const joinSchema = new mongoose.Schema({
    name: {
        type : String,
        required : true
    },
    ready: {
        type : Number,
        require : true
    },
    game: {
        type: Number,
        required : true
    }, 
    score: {
        type: Number, 
        required : true
    }
})
const collection = new mongoose.model('users', joinSchema);
const quizzes = new mongoose.model('quizzes', quizSchema);
const sel_quizzes = new mongoose.model('sel_quizzes', sel_quizSchema);


module.exports = {collection, quizzes, sel_quizzes};