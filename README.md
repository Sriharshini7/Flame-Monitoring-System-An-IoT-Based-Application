# 🔥 Flame Monitoring System

A comprehensive web-based fire detection monitoring system that integrates with Arduino flame sensors to provide real-time monitoring, alerts, and historical data tracking.

## 🚀 Features

### Core Functionality
- **Real-time Monitoring**: Live dashboard showing current flame detection status
- **SMS/Email Alerts**: Automatic notifications when fire is detected
- **Historical Data**: Complete log of all fire incidents with timestamps
- **Location Tracking**: Monitor multiple sensor locations
- **Interactive Charts**: Visual representation of sensor trends over time
- **Mobile Responsive**: Works perfectly on all devices

### Advanced Features
- **Multi-sensor Support**: Connect multiple Arduino sensors
- **Contact Management**: Manage emergency contacts for notifications
- **Incident Resolution**: Mark incidents as resolved with notes
- **System Status**: Real-time monitoring of system components
- **Data Export**: Export incident logs for analysis
- **Secure API**: Protected endpoints for Arduino communication

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite** for data storage
- **Socket.io** for real-time updates
- **Twilio** for SMS notifications
- **Nodemailer** for email alerts

### Frontend
- **React.js** with modern hooks
- **Chart.js** for data visualization
- **Socket.io-client** for real-time updates
- **React Router** for navigation
- **Responsive CSS** with glassmorphism design

### Hardware
- **Arduino Uno** or compatible
- **Flame Sensor** (analog)
- **LEDs** (Red for alert, White for safe)
- **Buzzer** for audio alerts
- **WiFi Module** (ESP8266) or Ethernet Shield

## 📋 Prerequisites

### Software
- Node.js (v14 or higher)
- npm or yarn
- Arduino IDE
- Git

### Hardware
- Arduino Uno board
- Flame sensor module
- Red LED + White LED
- Buzzer
- Breadboard and jumper wires
- WiFi module (ESP8266) or Ethernet Shield
- Power supply for Arduino

## 🚀 Quick Start

### 1. Clone and Setup Backend

```bash
# Clone the repository
git clone <repository-url>
cd TBP-Project

# Install backend dependencies
npm install

# Create database directory
mkdir database
```

### 2. Configure Environment

```bash
# Copy and edit environment file
cp .env.example .env

# Edit .env with your configuration:
# - Server settings
# - Database path
# - Twilio credentials (for SMS)
# - Email settings (for Gmail)
# - Arduino secret key
```

### 3. Setup Frontend

```bash
# Install frontend dependencies
cd client
npm install

# Create environment file
echo "REACT_APP_SERVER_URL=http://localhost:5000" > .env
```

### 4. Start the Application

```bash
# Start backend server (from project root)
npm start

# In a new terminal, start frontend (from client directory)
cd client
npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Dashboard**: Navigate to homepage

## 🔧 Arduino Setup

### Hardware Connections

```
Arduino Uno Connections:
- Flame Sensor A0 -> A0
- Red LED -> D7
- White LED -> D8
- Buzzer -> D9
- ESP8266 TX -> D3
- ESP8266 RX -> D2
```

### Arduino Code Setup

1. Open `arduino/flame_sensor_web.ino` in Arduino IDE
2. Update WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. Update server IP/domain:
   ```cpp
   const char* serverHost = "localhost"; // Change to your server IP
   ```
4. Upload code to Arduino

### Sensor Calibration

1. Open Serial Monitor (9600 baud)
2. Observe sensor values in safe environment
3. Adjust threshold in code:
   ```cpp
   const int flameThreshold = 400; // Adjust based on readings
   ```

## 📱 SMS/Email Setup

### Twilio SMS Setup

1. Create Twilio account at https://twilio.com
2. Get Account SID, Auth Token, and Phone Number
3. Update `.env` file:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   ```

### Gmail Email Setup

1. Enable 2-factor authentication on Gmail
2. Generate App Password
3. Update `.env` file:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

## 🌐 API Documentation

### Endpoints

#### Incidents
- `GET /api/incidents` - Get all incidents
- `GET /api/incidents/active` - Get active fire incidents
- `POST /api/incidents` - Create new incident (Arduino)
- `PUT /api/incidents/:id/resolve` - Resolve incident

#### Contacts
- `GET /api/contacts` - Get emergency contacts
- `POST /api/contacts` - Add emergency contact

#### Locations
- `GET /api/locations` - Get sensor locations
- `POST /api/locations` - Add sensor location

#### Statistics
- `GET /api/stats` - Get system statistics

### Arduino Data Format

```json
{
  "flame_detected": true,
  "sensor_value": 250,
  "temperature": 28.5,
  "humidity": 65.2,
  "location_id": 1,
  "secret_key": "arduino_secret_key_12345"
}
```

## 🎯 Usage Guide

### Dashboard Features

1. **Live Status**: Real-time monitoring of all sensors
2. **Alert Cards**: Active fire incidents with resolution options
3. **Statistics**: Overview of system performance
4. **Charts**: Historical trends and patterns
5. **Recent Incidents**: Detailed log of all events

### Settings Management

1. **Add Contacts**: Manage emergency notification recipients
2. **Configure Locations**: Set up sensor monitoring locations
3. **System Configuration**: Update notification preferences

### Incident Management

1. **View Active Alerts**: See current fire detections
2. **Resolve Incidents**: Mark fires as resolved with notes
3. **Historical Analysis**: Review past incidents for patterns

## 🔒 Security Features

- **API Key Authentication**: Secure Arduino communication
- **CORS Protection**: Prevent unauthorized access
- **Input Validation**: Protect against malicious data
- **Environment Variables**: Secure credential storage

## 🐛 Troubleshooting

### Common Issues

#### Arduino Not Connecting
- Check WiFi credentials
- Verify server IP address
- Ensure server is running
- Check serial monitor for errors

#### SMS Not Sending
- Verify Twilio credentials
- Check phone number format
- Ensure Twilio balance
- Review error logs

#### Frontend Not Loading
- Check backend server status
- Verify API endpoints
- Check browser console for errors
- Ensure CORS is configured

#### Database Issues
- Check database file permissions
- Verify SQLite installation
- Review database initialization logs

### Debug Mode

Enable debug logging by setting:
```
NODE_ENV=development
DEBUG=flame-monitor:*
```

## 📈 Performance Optimization

### Database Maintenance
- Regular cleanup of old records
- Index optimization for queries
- Backup strategies

### Server Scaling
- Load balancing for multiple sensors
- Caching strategies
- Monitoring and alerts

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes and test
4. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Note**: This project is designed for educational purposes and college lab environments. Please ensure proper safety measures and follow institutional guidelines when working with fire detection systems.
