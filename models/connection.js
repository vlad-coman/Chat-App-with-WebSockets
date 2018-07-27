const mongoose = require('mongoose');
      
const ConnectionSchema = new mongoose.Schema({
    users : [{
        username : {
            type:String,
            unique: true
        },
        socketId : String
     }],
});

module.exports = mongoose.model("Connection", ConnectionSchema);