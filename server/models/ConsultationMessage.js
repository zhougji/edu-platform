const mongoose = require('mongoose');

const consultationMessageSchema = new mongoose.Schema({
    consultationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consultation',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        enum: ['student', 'teacher'],
        required: true
    },
    time: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('ConsultationMessage', consultationMessageSchema); 