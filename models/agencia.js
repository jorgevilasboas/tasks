var mongoose = require("mongoose");

var agenciaSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: {
        type: Date,
        default: Date.now
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    atividades: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Atividade"
    }]
}, {
    usePushEach: true
});



module.exports = mongoose.model("Agencia", agenciaSchema);