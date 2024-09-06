const mongoose = require('mongoose');



const postSchema = mongoose.Schema({

      user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
      },
      date: {
            type: Date,
            default: Date.now,
      },

      likes: [{

            type: mongoose.Schema.Types.ObjectId,
            ref: "user"

      }],
      content: {
            type: String,
            required: true
      }

});

module.exports = mongoose.model('post', postSchema);