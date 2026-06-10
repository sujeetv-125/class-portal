const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['Teacher', 'Student'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Classroom Schema
const ClassroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Attachment Sub-Schema
const AttachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  type: { type: String, required: true } // 'image', 'raw', 'video', etc.
}, { _id: false });

// Announcement Schema
const AnnouncementSchema = new mongoose.Schema({
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [AttachmentSchema],
  comments: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Assignment Schema
const AssignmentSchema = new mongoose.Schema({
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date
  },
  attachments: [AttachmentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Submission Schema
const SubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  attachments: [AttachmentSchema],
  grade: {
    type: Number,
    min: 0
  },
  feedback: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a student can only submit once per assignment
SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

// Material Schema
const MaterialSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  cloudinaryUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  fileType: {
    type: String,
    required: true
  }
});

const User = mongoose.model('User', UserSchema);
const Classroom = mongoose.model('Classroom', ClassroomSchema);
const Announcement = mongoose.model('Announcement', AnnouncementSchema);
const Assignment = mongoose.model('Assignment', AssignmentSchema);
const Submission = mongoose.model('Submission', SubmissionSchema);
const Material = mongoose.model('Material', MaterialSchema);

module.exports = {
  User,
  Classroom,
  Announcement,
  Assignment,
  Submission,
  Material
};
