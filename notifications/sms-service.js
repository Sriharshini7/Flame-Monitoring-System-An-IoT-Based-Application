require('dotenv').config();
const twilio = require('twilio');

class SMSService {
  constructor() {
    // Initialize Twilio client if credentials are available
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      // Check if account SID starts with AC
      if (!process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
        console.log('⚠️ Invalid Twilio Account SID format. SMS notifications disabled.');
        this.enabled = false;
        return;
      }
      
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.enabled = true;
    } else {
      console.log('⚠️ Twilio credentials not configured. SMS notifications disabled.');
      this.enabled = false;
    }
  }

  validatePhoneNumber(phoneNumber) {
    // Basic phone number validation
    const cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/[-()]/g, '');
    
    // Check if it starts with + and has 10-15 digits
    if (!cleanNumber.startsWith('+') || cleanNumber.length < 10 || cleanNumber.length > 15) {
      return { valid: false, error: 'Invalid phone number format. Use international format: +country_code_number' };
    }
    
    // Check if it contains only digits after +
    if (!/^\+\d+$/.test(cleanNumber)) {
      return { valid: false, error: 'Phone number must contain only digits after the + sign' };
    }
    
    return { valid: true, cleanNumber };
  }

  async sendAlert(phoneNumber, incident) {
    if (!this.enabled) {
      console.log(`📱 SMS MOCK: Would be sent to ${phoneNumber}: Fire detected at ${incident.location}`);
      return { success: true, message: 'SMS service not configured - mock mode', mock: true };
    }

    // Validate phone number
    const phoneValidation = this.validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      console.error(`❌ Invalid phone number ${phoneNumber}: ${phoneValidation.error}`);
      return { success: false, error: phoneValidation.error };
    }

    const cleanNumber = phoneValidation.cleanNumber;
    
    try {
      console.log(`📱 Sending SMS to ${cleanNumber}...`);
      console.log(`📱 Message preview: ${this.formatAlertMessage(incident).substring(0, 50)}...`);
      
      const message = await this.client.messages.create({
        body: this.formatAlertMessage(incident),
        from: process.env.TWILIO_PHONE_NUMBER,
        to: cleanNumber
      });

      console.log(`✅ SMS sent successfully to ${cleanNumber}`);
      console.log(`📱 Message SID: ${message.sid}`);
      console.log(`📱 Status: ${message.status}`);
      console.log(`📱 From: ${message.from}`);
      console.log(`📱 To: ${message.to}`);
      
      return { 
        success: true, 
        messageId: message.sid,
        status: message.status,
        from: message.from,
        to: message.to
      };
    } catch (error) {
      console.error(`❌ Failed to send SMS to ${cleanNumber}:`);
      console.error(`❌ Error Code: ${error.code}`);
      console.error(`❌ Error Message: ${error.message}`);
      console.error(`❌ Error Status: ${error.status}`);
      
      // Provide specific error messages
      let errorMessage = error.message;
      if (error.code === 21614) {
        errorMessage = 'The "To" phone number is not a valid mobile number';
      } else if (error.code === 21610) {
        errorMessage = 'The "From" phone number is not verified for this account';
      } else if (error.code === 21408) {
        errorMessage = 'Permission to send SMS messages has not been enabled for this account';
      } else if (error.code === 21612) {
        errorMessage = 'The "To" phone number is currently unreachable';
      }
      
      return { success: false, error: errorMessage, code: error.code };
    }
  }

  formatAlertMessage(incident) {
    const timestamp = new Date(incident.timestamp).toLocaleString();
    return `🔥 FIRE ALERT! 
Location: ${incident.location}
Time: ${timestamp}
Sensor Value: ${incident.sensor_value}
Temperature: ${incident.temperature}°C
Humidity: ${incident.humidity}%

Please check immediately!`;
  }

  async sendTestAlert(phoneNumber) {
    const testIncident = {
      location: 'Test Location',
      timestamp: new Date().toISOString(),
      sensor_value: 150,
      temperature: 25.5,
      humidity: 60.0
    };

    return this.sendAlert(phoneNumber, testIncident);
  }

  async getMessageStatus(messageSid) {
    if (!this.enabled) {
      return { success: false, error: 'SMS service not enabled' };
    }

    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        success: true,
        sid: message.sid,
        status: message.status,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        dateSent: message.dateSent,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error) {
      console.error(`❌ Failed to get message status for ${messageSid}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async getAccountInfo() {
    if (!this.enabled) {
      return { success: false, error: 'SMS service not enabled' };
    }

    try {
      const account = await this.client.api.accounts(this.client.accountSid).fetch();
      return {
        success: true,
        accountSid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type,
        dateCreated: account.dateCreated
      };
    } catch (error) {
      console.error(`❌ Failed to get account info:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async getPhoneNumberInfo() {
    if (!this.enabled) {
      return { success: false, error: 'SMS service not enabled' };
    }

    try {
      const incomingPhoneNumbers = await this.client.incomingPhoneNumbers.list({
        phoneNumber: process.env.TWILIO_PHONE_NUMBER
      });

      if (incomingPhoneNumbers.length === 0) {
        return { success: false, error: 'Phone number not found in account' };
      }

      const phoneNumber = incomingPhoneNumbers[0];
      return {
        success: true,
        phoneNumber: phoneNumber.phoneNumber,
        friendlyName: phoneNumber.friendlyName,
        capabilities: phoneNumber.capabilities,
        status: phoneNumber.status,
        dateCreated: phoneNumber.dateCreated
      };
    } catch (error) {
      console.error(`❌ Failed to get phone number info:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = SMSService;
