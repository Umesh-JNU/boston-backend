const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true
  }
});

const messagesSchema = new mongoose.Schema({
  msgId: {
    type: String,
    required: true,
  }
}, { timestamps: true });


module.exports = {
  messageModel: mongoose.model("Messages", messagesSchema),
  tokenModel: mongoose.model('Token', tokenSchema)
};
