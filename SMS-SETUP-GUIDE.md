# SMS System Setup Guide

## Current Status
✅ **SMS Service is ENABLED**  
✅ **Twilio Account is ACTIVE** (Trial Account)  
❌ **Phone Number Issue**: The configured phone number (+917989045240) is not found in your Twilio account

## Issue Identified
Your SMS system is working correctly, but the phone number in your `.env` file is not properly configured in your Twilio account.

## Solutions

### Option 1: Use Twilio Trial Number (Recommended for Testing)
1. Go to your [Twilio Console](https://www.twilio.com/console)
2. Navigate to **Phone Numbers > Manage > Active Numbers**
3. Copy your **Trial Number** (usually starts with +1507XXXXXXX)
4. Update your `.env` file:
   ```
   TWILIO_PHONE_NUMBER=+1507XXXXXXX  # Replace with your actual trial number
   ```

### Option 2: Use Verified Phone Number (For Real SMS)
1. In Twilio Console, go to **Phone Numbers > Verified Caller IDs**
2. Add and verify your phone number (+917989045240)
3. Update your `.env` file with the verified number

### Option 3: Buy a Twilio Phone Number
1. Go to **Phone Numbers > Buy a Number**
2. Select a number with SMS capabilities
3. Purchase the number
4. Update your `.env` file

## Testing Your SMS System

### Method 1: Using the Test Script
```bash
node test-sms.js
```

### Method 2: Using API Endpoints
Start your server and use these endpoints:

1. **Check SMS Status**:
   ```bash
   curl http://localhost:5000/api/sms/status
   ```

2. **Validate Phone Number**:
   ```bash
   curl -X POST http://localhost:5000/api/sms/validate \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "+1234567890"}'
   ```

3. **Send Test SMS**:
   ```bash
   curl -X POST http://localhost:5000/api/debug-sms \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "+1234567890"}'
   ```

## Important Notes

### Trial Account Limitations
- Can only send SMS to **verified phone numbers**
- Limited number of messages per day
- Messages include "Sent from a Twilio trial account" text

### Phone Number Format
- Must be in **international format**: +country_code_number
- Example: +1234567890 (US), +917989045240 (India)
- No spaces, dashes, or parentheses

### Common Error Codes
- **21614**: Invalid "To" phone number
- **21610**: "From" number not verified
- **21408**: SMS permissions not enabled
- **21612**: "To" number unreachable

## Enhanced Features Added

### 1. Better Error Handling
- Detailed error messages with specific error codes
- Phone number validation
- Comprehensive logging

### 2. SMS Status Tracking
- Check message delivery status
- Account information retrieval
- Phone number capabilities

### 3. Debug Endpoints
- `/api/sms/status` - Service status and account info
- `/api/sms/message/:messageId` - Message status
- `/api/sms/validate` - Phone number validation
- `/api/debug-sms` - Send test SMS

## Next Steps

1. **Fix Phone Number**: Update your `.env` file with a valid Twilio number
2. **Restart Server**: `npm start`
3. **Test SMS**: Use the test script or API endpoints
4. **Add Contacts**: Add phone numbers to your contacts table
5. **Monitor Logs**: Check console output for SMS status

## Troubleshooting

### SMS Not Working?
1. Check phone number format (+country_code_number)
2. Verify Twilio account has SMS permissions
3. Ensure recipient number is verified (trial accounts)
4. Check account balance (paid accounts)

### Need Help?
- Check the console logs for detailed error messages
- Use the `/api/sms/status` endpoint to check configuration
- Run `node test-sms.js` for comprehensive testing
