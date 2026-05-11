const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const socketIo = require('socket.io');
const http = require('http');
const path = require('path');
require('dotenv').config();

// Import notification services
const SMSService = require('./notifications/sms-service');
const EmailService = require('./notifications/email-service');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Database setup
const dbPath = process.env.DB_PATH || './database/flame_monitoring.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Create fire incidents table
  db.run(`CREATE TABLE IF NOT EXISTS fire_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    location TEXT,
    flame_detected BOOLEAN NOT NULL,
    sensor_value INTEGER,
    temperature REAL,
    humidity REAL,
    notification_sent BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at DATETIME,
    notes TEXT
  )`, (err) => {
    if (err) console.error('Error creating fire_incidents table:', err.message);
  });

  // Create contacts table for SMS/Email notifications
  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating contacts table:', err.message);
  });

  // Create sensor locations table
  db.run(`CREATE TABLE IF NOT EXISTS sensor_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    latitude REAL,
    longitude REAL,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating sensor_locations table:', err.message);
  });
}

// API Routes

// Get all fire incidents
app.get('/api/incidents', (req, res) => {
  const query = `
    SELECT * FROM fire_incidents 
    ORDER BY timestamp DESC 
    LIMIT 100
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get active incidents
app.get('/api/incidents/active', (req, res) => {
  const query = `
    SELECT * FROM fire_incidents 
    WHERE flame_detected = TRUE AND resolved = FALSE
    ORDER BY timestamp DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add new fire incident (from Arduino)
app.post('/api/incidents', (req, res) => {
  const { 
    flame_detected, 
    sensor_value, 
    temperature, 
    humidity, 
    location_id,
    secret_key 
  } = req.body;

  // Validate secret key
  if (secret_key !== process.env.ARDUINO_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get location name
  const locationQuery = location_id ? 
    'SELECT name FROM sensor_locations WHERE id = ?' : 
    'SELECT name FROM sensor_locations WHERE is_active = TRUE LIMIT 1';
  
  db.get(locationQuery, [location_id], (err, locationRow) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const location = locationRow ? locationRow.name : 'Unknown Location';
    
    const query = `
      INSERT INTO fire_incidents (flame_detected, sensor_value, temperature, humidity, location)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(query, [flame_detected, sensor_value, temperature, humidity, location], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const incident = {
        id: this.lastID,
        flame_detected,
        sensor_value,
        temperature,
        humidity,
        location,
        timestamp: new Date().toISOString()
      };

      // Emit real-time update to all connected clients
      console.log('Emitting newIncident event:', incident);
      io.emit('newIncident', incident);

      // Send notifications if flame detected
      if (flame_detected) {
        sendNotifications(incident);
      }

      res.json({ success: true, incident_id: this.lastID });
    });
  });
});

// Resolve incident
app.put('/api/incidents/:id/resolve', (req, res) => {
  const { notes } = req.body;
  const query = `
    UPDATE fire_incidents 
    SET resolved = TRUE, resolved_at = CURRENT_TIMESTAMP, notes = ?
    WHERE id = ?
  `;
  
  db.run(query, [notes, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

// Get contacts
app.get('/api/contacts', (req, res) => {
  db.all('SELECT * FROM contacts WHERE is_active = TRUE', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add contact
app.post('/api/contacts', (req, res) => {
  const { name, phone, email } = req.body;
  const query = 'INSERT INTO contacts (name, phone, email) VALUES (?, ?, ?)';
  
  db.run(query, [name, phone, email], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, contact_id: this.lastID });
  });
});

// Get sensor locations
app.get('/api/locations', (req, res) => {
  db.all('SELECT * FROM sensor_locations WHERE is_active = TRUE', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add sensor location
app.post('/api/locations', (req, res) => {
  const { name, description, latitude, longitude, address } = req.body;
  const query = `
    INSERT INTO sensor_locations (name, description, latitude, longitude, address)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [name, description, latitude, longitude, address], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, location_id: this.lastID });
  });
});

// Get statistics
app.get('/api/stats', (req, res) => {
  const queries = {
    total: 'SELECT COUNT(*) as count FROM fire_incidents',
    today: 'SELECT COUNT(*) as count FROM fire_incidents WHERE DATE(timestamp) = DATE("now")',
    active: 'SELECT COUNT(*) as count FROM fire_incidents WHERE flame_detected = TRUE AND resolved = FALSE',
    locations: 'SELECT COUNT(*) as count FROM sensor_locations WHERE is_active = TRUE'
  };

  const stats = {};
  let completed = 0;
  
  Object.keys(queries).forEach(key => {
    db.get(queries[key], [], (err, row) => {
      if (!err) {
        stats[key] = row.count;
      }
      completed++;
      if (completed === Object.keys(queries).length) {
        res.json(stats);
      }
    });
  });
});

// Test notification endpoint
app.post('/api/test-notification', async (req, res) => {
  const { type, recipient } = req.body;
  
  const testIncident = {
    location: 'Test Location',
    timestamp: new Date().toISOString(),
    sensor_value: 150,
    temperature: 25.5,
    humidity: 60.0
  };

  try {
    let result;
    if (type === 'sms') {
      result = await smsService.sendAlert(recipient, testIncident);
    } else if (type === 'email') {
      result = await emailService.sendAlert(recipient, testIncident);
    } else {
      return res.status(400).json({ error: 'Invalid notification type' });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SMS debug endpoint
app.post('/api/debug-sms', async (req, res) => {
  const { phoneNumber } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // Check SMS service status
    const status = {
      serviceEnabled: smsService.enabled,
      credentials: {
        accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing',
        authToken: process.env.TWILIO_AUTH_TOKEN ? 'Present' : 'Missing',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Missing'
      }
    };

    if (!smsService.enabled) {
      return res.json({ 
        success: false, 
        status,
        message: 'SMS service is not enabled. Check credentials.' 
      });
    }

    // Send test SMS
    const testIncident = {
      location: 'Debug Test',
      timestamp: new Date().toISOString(),
      sensor_value: 999,
      temperature: 99.9,
      humidity: 99.9
    };

    const result = await smsService.sendAlert(phoneNumber, testIncident);
    
    res.json({
      success: true,
      status,
      result,
      message: 'SMS test completed'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
});

// SMS status endpoint
app.get('/api/sms/status', async (req, res) => {
  try {
    const status = {
      serviceEnabled: smsService.enabled,
      credentials: {
        accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing',
        authToken: process.env.TWILIO_AUTH_TOKEN ? 'Present' : 'Missing',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Missing'
      }
    };

    if (!smsService.enabled) {
      return res.json(status);
    }

    // Get additional info if service is enabled
    const [accountInfo, phoneInfo] = await Promise.all([
      smsService.getAccountInfo(),
      smsService.getPhoneNumberInfo()
    ]);

    res.json({
      ...status,
      account: accountInfo.success ? accountInfo : null,
      phoneNumber: phoneInfo.success ? phoneInfo : null
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SMS message status endpoint
app.get('/api/sms/message/:messageId', async (req, res) => {
  const { messageId } = req.params;
  
  if (!messageId) {
    return res.status(400).json({ error: 'Message ID is required' });
  }

  try {
    const status = await smsService.getMessageStatus(messageId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phone number validation endpoint
app.post('/api/sms/validate', (req, res) => {
  const { phoneNumber } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const validation = smsService.validatePhoneNumber(phoneNumber);
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize notification services
const smsService = new SMSService();
const emailService = new EmailService();

// Notification functions
function sendNotifications(incident) {
  // Get all active contacts
  db.all('SELECT * FROM contacts WHERE is_active = TRUE', [], (err, contacts) => {
    if (err) return;
    
    contacts.forEach(contact => {
      // Send SMS
      if (contact.phone) {
        smsService.sendAlert(contact.phone, incident);
      }
      
      // Send Email
      if (contact.email) {
        emailService.sendAlert(contact.email, incident);
      }
    });
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
