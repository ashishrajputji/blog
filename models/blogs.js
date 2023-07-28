const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blogSchema = new Schema({
title : {type : String, required : true},
intro : {type : String, required : true},
description : {type : String, required : true},
conclusion : {type : String, required : true},
category : {type : String, required : true},
video : {type : String},
date : {type : Date, default : Date.now},
image:
    {
        data: Buffer,
        contentType: String
    }
});

module.exports = mongoose.model("Blog", blogSchema);