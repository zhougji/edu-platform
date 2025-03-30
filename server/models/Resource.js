const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, '请提供资源标题'],
        trim: true,
        maxlength: [100, '标题不能超过100个字符']
    },
    description: {
        type: String,
        required: [true, '请提供资源描述'],
        maxlength: [2000, '描述不能超过2000个字符']
    },
    type: {
        type: String,
        enum: ['video', 'document', 'image', 'audio', 'other'],
        default: 'video'
    },
    subject: {
        type: String,
        required: [true, '请选择学科'],
        enum: ['mathematics', 'physics', 'chemistry', 'biology', 'history',
            'geography', 'literature', 'english', 'computer_science', 'other']
    },
    grade: {
        type: String,
        required: [true, '请选择年级'],
        enum: ['primary1', 'primary2', 'primary3', 'primary4', 'primary5', 'primary6',
            'junior1', 'junior2', 'junior3',
            'senior1', 'senior2', 'senior3',
            'university', 'professional', 'other']
    },
    tags: [String],
    videoUrl: {
        type: String
    },
    videoFile: {
        type: String
    },
    thumbnailUrl: {
        type: String
    },
    duration: {
        type: Number, // 视频时长（秒）
        default: 0
    },
    fileSize: {
        type: Number, // 文件大小（字节）
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    views: {
        type: Number,
        default: 0
    },
    downloads: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comments: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            text: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    ratings: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            rating: {
                type: Number,
                min: 1,
                max: 5,
                required: true
            }
        }
    ],
    averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// 计算平均评分
ResourceSchema.methods.calculateAverageRating = function () {
    if (this.ratings.length === 0) {
        this.averageRating = 0;
        return;
    }

    const sum = this.ratings.reduce((acc, item) => acc + item.rating, 0);
    this.averageRating = sum / this.ratings.length;
};

// 保存前更新平均评分
ResourceSchema.pre('save', function (next) {
    if (this.isModified('ratings')) {
        this.calculateAverageRating();
    }
    this.updatedAt = Date.now();
    next();
});

// 索引优化查询性能
ResourceSchema.index({ title: 'text', description: 'text', tags: 'text' });
ResourceSchema.index({ subject: 1, grade: 1 });
ResourceSchema.index({ createdAt: -1 });
ResourceSchema.index({ averageRating: -1 });
ResourceSchema.index({ views: -1 });

module.exports = mongoose.model('Resource', ResourceSchema); 