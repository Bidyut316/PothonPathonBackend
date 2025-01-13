// Import required modules
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create an Express app
const app = express();
const PORT = 3210;

// Helper function to create directories if they don't exist
const ensureDirectoryExistence = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure directories
const uploadBaseDir = path.join(__dirname, 'uploads');
const enoteDir = path.join(uploadBaseDir, 'enote');
const homeworkDir = path.join(uploadBaseDir, 'homeworks');
const homeworkUploadDir = path.join(homeworkDir, 'uploads');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Ensure directories exist
ensureDirectoryExistence(enoteDir);
ensureDirectoryExistence(homeworkDir);
ensureDirectoryExistence(homeworkUploadDir);
// Basic Auth Middleware
const basicAuth = (req, res, next) => {
  // Get the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ message: 'Authorization header is missing or invalid' });
  }

    // Decode the Base64 encoded credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [userId, password] = credentials.split(':');
  
    // Hardcoded user credentials for demonstration (replace with DB lookup in production)
    const validUserId = 'admin';
    const validPassword = 'Pothon-Pathon123@';
  
    // Compare the credentials
    if (userId === validUserId && password === validPassword) {
      req.user = { id: userId }; // Add user information to the request object
      return next(); // Pass control to the next middleware or route handler
    }
  
    // Unauthorized response
    return res.status(401).json({ message: 'Invalid user ID or password' });
  };



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let targetDir;
    if (req.path === '/enote') {
      targetDir = enoteDir;
    } else if (req.path === '/homework') {
        targetDir = homeworkDir;
    }else if (req.path === '/homework/upload') {
        targetDir = homeworkUploadDir;
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB limit
  fileFilter 
});

// Root API endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the file upload API!' });
});

// API endpoint to upload a file to /enote
app.post('/enote',basicAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type' });
  }

  const filePath = path.join('/uploads/enote', req.file.filename);
  res.status(200).json({
    message: 'File uploaded successfully',
    path: filePath
  });
});

// API endpoint to upload a file to /homework
app.post('/homework', basicAuth,upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type' });
  }


    filePath = path.join('/uploads/homeworks', req.file.filename);
  res.status(200).json({
    message: 'File uploaded successfully',
    path: filePath
  });
});
app.post('/homework/upload', basicAuth,upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file type' });
    }
  
  
      filePath = path.join('/uploads/homeworks/upload', req.file.filename);
    res.status(200).json({
      message: 'File uploaded successfully',
      path: filePath
    });
  });
  
// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadBaseDir));

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.get('*', (req, res) => {
    res.status(404).json({ message: 'Page not Found!' });
  });
  app.post('*', (req, res) => {
    res.status(404).json({ message: 'Page not Found!' });
  });
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
