const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const upload = multer({ dest: 'uploads/' });

const DATA_FILE = path.join(__dirname, 'data.json');

// Đọc dữ liệu từ file
function readData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// Ghi dữ liệu vào file
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Không có file' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    name: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype,
    url: fileUrl,
  });
});

// Lưu dữ liệu JSON
app.post('/api/save', (req, res) => {
  const data = req.body;
  writeData(data);
  res.json({ success: true });
});

// Lấy dữ liệu JSON
app.get('/api/data', (req, res) => {
  const data = readData();
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`https://github.com/dotronggiap10-netizen/qlkh.git${PORT}`));
