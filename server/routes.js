const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, Classroom, Announcement, Assignment, Submission, Material } = require('./models');
const { verifyFirebaseToken, authenticate, isTeacher, isStudent, signToken } = require('./auth');
const { upload, cloudinary } = require('./cloudinary');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-key-classportal';

// --- Helper Functions ---
function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars like O, 0, I, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// --- Auth Routes ---

// Sync Firebase authentication with MongoDB and issue a custom backend JWT
router.post('/auth/sync', async (req, res) => {
  const { idToken, role, name } = req.body;
  if (!idToken) {
    return res.status(400).json({ message: 'Firebase ID token is required' });
  }

  try {
    const firebaseUser = await verifyFirebaseToken(idToken);
    
    // Find or create User in MongoDB
    let user = await User.findOne({ email: firebaseUser.email });
    
    if (!user) {
      // Create user profile
      user = new User({
        name: name || firebaseUser.name || 'Anonymous User',
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
        role: role || 'Student' // Default to Student if not specified
      });
      await user.save();
    } else {
      // Sync firebaseUid if it was missing or update name if empty
      let updated = false;
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUser.uid;
        updated = true;
      }
      if (name && user.name !== name) {
        user.name = name;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    // Sign our own server session JWT
    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Error synchronizing user session', error: error.message });
  }
});

// GET current user profile details
router.get('/auth/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  const idToken = req.body.idToken || req.body.token;
  if (!idToken) {
    return res.status(400).json({ message: 'Firebase ID token is required' });
  }

  try {
    const firebaseUser = await verifyFirebaseToken(idToken);
    
    // Look up user in MongoDB by email
    let user = await User.findOne({ email: firebaseUser.email });
    
    if (!user) {
      // Create a new user document with role "Student"
      user = new User({
        name: firebaseUser.name || firebaseUser.email.split('@')[0],
        email: firebaseUser.email,
        firebaseUid: firebaseUser.uid,
        role: 'Student'
      });
      await user.save();
    } else {
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUser.uid;
        await user.save();
      }
    }

    // Sign a JWT containing { userId, email, role }
    const token = jwt.sign(
      { userId: user._id, id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
});

// POST /api/auth/seed (disable in production)
router.post('/auth/seed', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Seeding is disabled in production.' });
  }

  try {
    // Clean up any old seed data
    await User.deleteMany({ email: { $in: ['seed.teacher@classportal.com', 'seed.student@classportal.com'] } });

    const teacher = new User({
      name: 'Seed Teacher',
      email: 'seed.teacher@classportal.com',
      firebaseUid: 'seed_teacher_firebase_uid_123',
      role: 'Teacher'
    });

    const student = new User({
      name: 'Seed Student',
      email: 'seed.student@classportal.com',
      firebaseUid: 'seed_student_firebase_uid_123',
      role: 'Student'
    });

    await teacher.save();
    await student.save();

    res.json({
      message: 'Database seeded successfully',
      teacher: { id: teacher._id, email: teacher.email, role: teacher.role },
      student: { id: student._id, email: student.email, role: student.role }
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ message: 'Seeding failed', error: error.message });
  }
});

// --- Classroom Routes ---

// GET list of classrooms the user is in (either as Teacher/Owner or Student/Enrolled)
router.get('/classrooms', authenticate, async (req, res) => {
  try {
    let classrooms;
    if (req.user.role === 'Teacher') {
      classrooms = await Classroom.find({ owner: req.user._id })
        .populate('owner', 'name email')
        .sort({ createdAt: -1 });
    } else {
      classrooms = await Classroom.find({ students: req.user._id })
        .populate('owner', 'name email')
        .sort({ createdAt: -1 });
    }
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving classrooms', error: error.message });
  }
});

// POST create a classroom (Teacher only)
router.post('/classrooms', authenticate, isTeacher, async (req, res) => {
  const { name, section, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Classroom name is required' });
  }

  try {
    let code;
    let codeExists = true;
    
    // Keep generating class codes until a unique one is found
    while (codeExists) {
      code = generateClassCode();
      const existing = await Classroom.findOne({ code });
      if (!existing) codeExists = false;
    }

    const classroom = new Classroom({
      name,
      section,
      description,
      code,
      owner: req.user._id,
      students: []
    });

    await classroom.save();
    
    const populated = await Classroom.findById(classroom._id).populate('owner', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error creating classroom', error: error.message });
  }
});

// POST join a classroom via code (Student only)
router.post('/classrooms/join', authenticate, isStudent, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Class code is required' });
  }

  try {
    const classroom = await Classroom.findOne({ code: code.trim().toUpperCase() });
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found. Verify the code and try again.' });
    }

    // Check if student is already in the class
    if (classroom.students.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already joined this classroom.' });
    }

    classroom.students.push(req.user._id);
    await classroom.save();

    const populated = await Classroom.findById(classroom._id).populate('owner', 'name email');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error joining classroom', error: error.message });
  }
});

// GET specific classroom details (both Student and Teacher)
router.get('/classrooms/:id', authenticate, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('students', 'name email');

    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Verify user membership
    const isOwner = classroom.owner._id.toString() === req.user._id.toString();
    const isEnrolled = classroom.students.some(s => s._id.toString() === req.user._id.toString());

    if (!isOwner && !isEnrolled) {
      return res.status(403).json({ message: 'Access denied: You are not enrolled in this classroom.' });
    }

    res.json(classroom);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving classroom', error: error.message });
  }
});


// --- Announcement Streams & Comments ---

// GET announcements for classroom
router.get('/classrooms/:id/announcements', authenticate, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    const announcements = await Announcement.find({ classroom: req.params.id })
      .populate('sender', 'name email role')
      .populate('comments.sender', 'name email role')
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving announcements', error: error.message });
  }
});

// POST announcement to classroom (with file attachments)
router.post('/classrooms/:id/announcements', authenticate, upload.array('files', 5), async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Announcement content cannot be empty' });
  }

  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Verify enrollment/ownership
    const isOwner = classroom.owner.toString() === req.user._id.toString();
    const isStudent = classroom.students.includes(req.user._id);
    if (!isOwner && !isStudent) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Format uploaded files
    const attachments = (req.files || []).map(file => ({
      name: file.originalname,
      url: file.path,
      publicId: file.filename,
      type: file.mimetype.split('/')[0] // 'image', 'video', or 'raw'
    }));

    const announcement = new Announcement({
      classroom: req.params.id,
      sender: req.user._id,
      content,
      attachments,
      comments: []
    });

    await announcement.save();

    const populated = await Announcement.findById(announcement._id)
      .populate('sender', 'name email role');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error posting announcement', error: error.message });
  }
});

// POST add comment to an announcement
router.post('/announcements/:id/comments', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Comment text cannot be empty' });
  }

  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    announcement.comments.push({
      sender: req.user._id,
      content
    });

    await announcement.save();

    const updated = await Announcement.findById(announcement._id)
      .populate('sender', 'name email role')
      .populate('comments.sender', 'name email role');

    res.status(201).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});


// --- Assignment Routes ---

// GET assignments for classroom
router.get('/classrooms/:id/assignments', authenticate, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    const assignments = await Assignment.find({ classroom: req.params.id })
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving assignments', error: error.message });
  }
});

// POST create assignment (Teacher only)
router.post('/classrooms/:id/assignments', authenticate, isTeacher, upload.array('files', 5), async (req, res) => {
  const { title, description, dueDate } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  try {
    const classroom = await Classroom.findOne({ _id: req.params.id, owner: req.user._id });
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found or you are not the owner' });
    }

    // Format uploaded files
    const attachments = (req.files || []).map(file => ({
      name: file.originalname,
      url: file.path,
      publicId: file.filename,
      type: file.mimetype.split('/')[0]
    }));

    const assignment = new Assignment({
      classroom: req.params.id,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      attachments
    });

    await assignment.save();
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
});

// GET assignment details
router.get('/assignments/:id', authenticate, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate({
        path: 'classroom',
        select: 'name owner students',
        populate: { path: 'owner', select: 'name email' }
      });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Verify membership
    const classroom = assignment.classroom;
    const isOwner = classroom.owner._id.toString() === req.user._id.toString();
    const isEnrolled = classroom.students.includes(req.user._id);

    if (!isOwner && !isEnrolled) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving assignment', error: error.message });
  }
});


// --- Submission Routes ---

// GET submissions for assignment
// For Teachers: list all submissions
// For Students: return their single submission
router.get('/assignments/:id/submissions', authenticate, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('classroom');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (req.user.role === 'Teacher') {
      // Double check teacher is class owner
      if (assignment.classroom.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied: You are not the teacher of this class.' });
      }

      const submissions = await Submission.find({ assignment: req.params.id })
        .populate('student', 'name email')
        .sort({ submittedAt: -1 });
      res.json(submissions);
    } else {
      // Return student's single submission
      const submission = await Submission.findOne({ assignment: req.params.id, student: req.user._id })
        .populate('student', 'name email');
      res.json(submission); // Returns null if not submitted yet, which is expected
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving submission info', error: error.message });
  }
});

// POST submit assignment (Student only)
router.post('/assignments/:id/submissions', authenticate, isStudent, upload.array('files', 5), async (req, res) => {
  const { content } = req.body;

  try {
    const assignment = await Assignment.findById(req.params.id).populate('classroom');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Verify student is enrolled in classroom
    if (!assignment.classroom.students.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied: You are not enrolled in this class.' });
    }

    // Format uploaded files
    const attachments = (req.files || []).map(file => ({
      name: file.originalname,
      url: file.path,
      publicId: file.filename,
      type: file.mimetype.split('/')[0]
    }));

    // Find if already submitted and update, or create a new one
    let submission = await Submission.findOne({ assignment: req.params.id, student: req.user._id });

    if (submission) {
      // Update submission (optionally remove old attachments in Cloudinary if needed, but for simplicity we append/replace)
      submission.content = content || submission.content;
      if (attachments.length > 0) {
        submission.attachments = attachments; // replace attachments with new ones
      }
      submission.submittedAt = Date.now();
      await submission.save();
    } else {
      submission = new Submission({
        assignment: req.params.id,
        student: req.user._id,
        content,
        attachments
      });
      await submission.save();
    }

    const populated = await Submission.findById(submission._id).populate('student', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting assignment', error: error.message });
  }
});

// POST grade a submission (Teacher only)
router.post('/submissions/:id/grade', authenticate, isTeacher, async (req, res) => {
  const { grade, feedback } = req.body;
  if (grade === undefined) {
    return res.status(400).json({ message: 'Grade is required' });
  }

  try {
    const submission = await Submission.findById(req.params.id).populate({
      path: 'assignment',
      populate: { path: 'classroom' }
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify teacher owns the class
    if (submission.assignment.classroom.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You are not the teacher of this class.' });
    }

    submission.grade = Number(grade);
    submission.feedback = feedback || '';
    await submission.save();

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Error grading submission', error: error.message });
  }
});

// --- Material Upload & Retrieval Routes ---

const multer = require('multer');
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper function to upload file buffer to Cloudinary using upload_stream
const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const ext = originalName.split('.').pop().toLowerCase();
    
    if (process.env.CLOUDINARY_API_KEY === 'mock_key' || !process.env.CLOUDINARY_API_KEY) {
      console.log('Using mock Cloudinary upload bypass');
      return resolve({
        secure_url: `https://res.cloudinary.com/mock_cloud/raw/upload/v12345678/${originalName}`,
        public_id: `mock_public_id_${Date.now()}`
      });
    }

    // Cloudinary requires specifying 'resource_type' for non-images
    let resource_type = 'raw';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      resource_type = 'image';
    } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
      resource_type = 'video';
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'classportal_materials',
        resource_type: resource_type,
        public_id: `${Date.now()}-${originalName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_')}`
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = (publicId, fileType) => {
  return new Promise((resolve, reject) => {
    if (process.env.CLOUDINARY_API_KEY === 'mock_key' || !process.env.CLOUDINARY_API_KEY) {
      console.log('Using mock Cloudinary delete bypass');
      return resolve({ result: 'ok' });
    }

    let resource_type = 'raw';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(fileType.toLowerCase())) {
      resource_type = 'image';
    } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(fileType.toLowerCase())) {
      resource_type = 'video';
    }

    cloudinary.uploader.destroy(publicId, { resource_type }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

// POST /api/upload -> only for teachers
router.post('/upload', authenticate, isTeacher, uploadMemory.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const { subject, description } = req.body;
  if (!subject) {
    return res.status(400).json({ message: 'Subject is required' });
  }

  try {
    // Upload buffer to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    
    const fileType = req.file.originalname.split('.').pop().toLowerCase();

    // Save metadata to MongoDB
    const material = new Material({
      filename: req.file.originalname,
      cloudinaryUrl: result.secure_url,
      publicId: result.public_id,
      subject,
      description: description || '',
      uploadedBy: req.user._id,
      fileType
    });

    await material.save();

    const populated = await Material.findById(material._id).populate('uploadedBy', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Material upload error:', error);
    res.status(500).json({ message: 'Failed to upload material', error: error.message });
  }
});

// GET /api/materials -> for all logged-in users
router.get('/materials', authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject) {
      filter.subject = { $regex: new RegExp(`^${req.query.subject}$`, 'i') };
    }

    const materials = await Material.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve materials', error: error.message });
  }
});

// DELETE /api/materials/:id -> only for teachers
router.delete('/materials/:id', authenticate, isTeacher, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(material.publicId, material.fileType);
    } catch (clErr) {
      console.warn('Cloudinary delete warning (proceeding anyway):', clErr.message);
    }

    // Delete from MongoDB
    await Material.findByIdAndDelete(req.params.id);

    res.json({ message: 'Material successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete material', error: error.message });
  }
});

module.exports = router;
