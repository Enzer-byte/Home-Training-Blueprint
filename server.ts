import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Enable JSON body parser with generous limit for image uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Directories for persistent data and uploads
const DATA_DIR = path.join(process.cwd(), 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
  fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(PUBLIC_UPLOADS_DIR));

// Admin authentication constants & in-memory session tokens
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'blueprint2025';
const validTokens = new Set<string>();

// Helper to check admin authorization
function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.split(' ')[1];
  return validTokens.has(token);
}

// ----------------- API ROUTES -----------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  const cleanUser = String(username || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  const isUserValid =
    cleanUser === 'admin' ||
    cleanUser === 'ebenezer' ||
    cleanUser === 'ebenezerobey05@gmail.com' ||
    cleanUser === ADMIN_USERNAME.trim().toLowerCase();

  const isPassValid =
    cleanPass === 'blueprint2025' ||
    cleanPass === 'Vickky_ben@2006' ||
    cleanPass === ADMIN_PASSWORD.trim();

  if (isUserValid && isPassValid) {
    const token = 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    validTokens.add(token);
    return res.json({
      success: true,
      token,
      username: username || ADMIN_USERNAME,
      message: 'Login successful'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid username or password'
  });
});

// Admin Verify Token
app.get('/api/admin/verify', (req: Request, res: Response) => {
  if (isAuthorized(req)) {
    return res.json({ success: true, authenticated: true });
  }
  return res.status(401).json({ success: false, authenticated: false });
});

// Admin Logout
app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    validTokens.delete(token);
  }
  res.json({ success: true, message: 'Logged out' });
});

// GET Current Sales Page Content
app.get('/api/content', (req: Request, res: Response) => {
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      const fileData = fs.readFileSync(CONTENT_FILE, 'utf-8');
      const content = JSON.parse(fileData);
      return res.json({ success: true, content });
    }
    // If not written yet, frontend uses defaultContent
    return res.json({ success: true, content: null });
  } catch (error) {
    console.error('Error reading content file:', error);
    return res.status(500).json({ success: false, message: 'Failed to read content' });
  }
});

// UPDATE Sales Page Content (Requires Auth)
app.put('/api/content', (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
  }

  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2), 'utf-8');
    return res.json({
      success: true,
      message: 'Content updated successfully',
      content
    });
  } catch (error) {
    console.error('Error saving content file:', error);
    return res.status(500).json({ success: false, message: 'Failed to save content' });
  }
});

// RESET Content to Default (Requires Auth)
app.post('/api/admin/reset-content', (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    if (fs.existsSync(CONTENT_FILE)) {
      fs.unlinkSync(CONTENT_FILE);
    }
    return res.json({ success: true, message: 'Content reset to original defaults' });
  } catch (error) {
    console.error('Error resetting content:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset content' });
  }
});

// UPLOAD Image (Requires Auth)
// Accepts base64 encoded image data with metadata
app.post('/api/upload', (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { fileData, fileName, fileType } = req.body;

    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({ success: false, message: 'Image data is required' });
    }

    // Validate mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    const detectedType = fileType || (fileData.match(/^data:([a-zA-Z0-9/+-]+);base64,/)?.[1] || '');

    if (detectedType && !allowedTypes.includes(detectedType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPG, PNG, WEBP, and GIF are supported.'
      });
    }

    // Extract raw base64 buffer
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 5MB maximum file size check
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit. Please choose a smaller image.'
      });
    }

    // Generate safe unique filename
    const ext = detectedType.includes('png')
      ? '.png'
      : detectedType.includes('webp')
      ? '.webp'
      : detectedType.includes('gif')
      ? '.gif'
      : detectedType.includes('svg')
      ? '.svg'
      : '.jpg';

    const safeBaseName = (fileName || 'img')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const uniqueFileName = `${Date.now()}_${safeBaseName}${ext}`;
    const destinationPath = path.join(PUBLIC_UPLOADS_DIR, uniqueFileName);

    fs.writeFileSync(destinationPath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;
    return res.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
      sizeBytes: buffer.length
    });
  } catch (error) {
    console.error('Image upload failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});

// ----------------- VITE MIDDLEWARE & SPA ROUTING -----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Home Training Blueprint server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
