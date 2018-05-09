var mongoose = require("mongoose");

var atividadeSchema = mongoose.Schema({
    title: String,
    start: Date,
    end: Date,
    url: String,
    car: String,
    km: Number,
    transport: Number,
    color: String,
    status: String,
    obs: String,
    fields: [],
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