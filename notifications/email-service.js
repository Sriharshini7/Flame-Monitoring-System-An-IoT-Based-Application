const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Initialize email transporter if credentials are available
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      this.enabled = true;
      this.fireAlertSent = false;
      this.lastState = null;
    } else {
      console.log('⚠️ Email credentials not configured. Email notifications disabled.');
      this.enabled = false;
    }
  }

  async sendAlert(email, incident) {
    if (!this.enabled) {
      console.log(`Email would be sent to ${email}: Fire detected at ${incident.location}`);
      return { success: true, message: 'Email service not configured' };
    }

    try {
      // Use your SMTP configuration for immediate email sending
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Fire Alert 🚨",
        html: `🔥 FIRE DETECTED! Take action immediately!<br><br>
               Location: ${incident.location}<br>
               Time: ${new Date(incident.timestamp).toLocaleString()}<br>
               Temperature: ${incident.temperature}°C<br>
               Humidity: ${incident.humidity}%<br>
               Sensor Value: ${incident.sensor_value}`,
        text: `🔥 FIRE DETECTED! Take action immediately!\n\n
               Location: ${incident.location}\n
               Time: ${new Date(incident.timestamp).toLocaleString()}\n
               Temperature: ${incident.temperature}°C\n
               Humidity: ${incident.humidity}%\n
               Sensor Value: ${incident.sensor_value}`
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${email}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Failed to send email to ${email}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  formatAlertHTML(incident) {
    const timestamp = new Date(incident.timestamp).toLocaleString();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Fire Alert</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #ff6b6b, #ff8e53); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 2.5em; }
            .content { padding: 30px; }
            .alert-info { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .details { margin: 20px 0; }
            .details h3 { color: #333; margin-bottom: 10px; }
            .details p { margin: 8px 0; color: #666; }
            .details strong { color: #333; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 0.9em; }
            .urgent { animation: pulse 2s infinite; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="urgent">🔥 FIRE ALERT</h1>
                <p>Immediate Action Required</p>
            </div>
            <div class="content">
                <div class="alert-info">
                    <strong>⚠️ Fire has been detected at your monitored location!</strong>
                </div>
                
                <div class="details">
                    <h3>📍 Location Details</h3>
                    <p><strong>Location:</strong> ${incident.location}</p>
                    <p><strong>Time:</strong> ${timestamp}</p>
                </div>
                
                <div class="details">
                    <h3>📊 Sensor Readings</h3>
                    <p><strong>Flame Sensor Value:</strong> ${incident.sensor_value}</p>
                    <p><strong>Temperature:</strong> ${incident.temperature}°C</p>
                    <p><strong>Humidity:</strong> ${incident.humidity}%</p>
                </div>
                
                <div class="details">
                    <h3>🚨 Recommended Actions</h3>
                    <p>1. <strong>Evacuate immediately</strong> if you are in the area</p>
                    <p>2. <strong>Call emergency services</strong> (911 or local emergency number)</p>
                    <p>3. <strong>Do not attempt</strong> to fight the fire unless trained</p>
                    <p>4. <strong>Alert others</strong> in the vicinity</p>
                </div>
            </div>
            <div class="footer">
                <p>This alert was generated by the Flame Monitoring System</p>
                <p>System Time: ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  formatAlertText(incident) {
    const timestamp = new Date(incident.timestamp).toLocaleString();
    
    return `🔥 FIRE ALERT - IMMEDIATE ACTION REQUIRED

LOCATION: ${incident.location}
TIME: ${timestamp}

SENSOR READINGS:
- Flame Sensor Value: ${incident.sensor_value}
- Temperature: ${incident.temperature}°C
- Humidity: ${incident.humidity}%

RECOMMENDED ACTIONS:
1. Evacuate immediately if you are in the area
2. Call emergency services (911 or local emergency number)
3. Do not attempt to fight the fire unless trained
4. Alert others in the vicinity

This alert was generated by the Flame Monitoring System
System Time: ${new Date().toLocaleString()}`;
  }

  async sendTestAlert(email) {
    const testIncident = {
      location: 'Test Location',
      timestamp: new Date().toISOString(),
      sensor_value: 150,
      temperature: 25.5,
      humidity: 60.0
    };

    return this.sendAlert(email, testIncident);
  }
}

module.exports = EmailService;
