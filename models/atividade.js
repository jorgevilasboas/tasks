var mongoose = require("mongoose");

var atividadeSchema = mongoose.Schema({
    title: String,
    start: Date,
    end: Date,
    url: String,
    km: Number,
    resource_type: String,
    resource_value: Number,
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