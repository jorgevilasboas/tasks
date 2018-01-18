var mongoose = require("mongoose");

var atividadeSchema = mongoose.Schema({
    tile: String,
    start: Date,
    end: Date,
    url: String,
    createdAt: { type: Date, default: Date.now },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model("Atividade", atividadeSchema);