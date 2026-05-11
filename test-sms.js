require('dotenv').config();
const SMSService = require('./notifications/sms-service');

async function testSMSSystem() {
  console.log('🧪 Starting SMS System Test...\n');
  
  const sms = new SMSService();
  
  // Test 1: Service Status
  console.log('📋 Test 1: Service Status');
  console.log('SMS Service Enabled:', sms.enabled);
  console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing');
  console.log('Auth Token:', process.env.TWILIO_AUTH_TOKEN ? 'Present' : 'Missing');
  console.log('Phone Number:', process.env.TWILIO_PHONE_NUMBER || 'Missing');
  console.log('');

  if (!sms.enabled) {
    console.log('❌ SMS service is not enabled. Please check your .env file.');
    return;
  }

  // Test 2: Account Information
  console.log('📋 Test 2: Account Information');
  try {
    const accountInfo = await sms.getAccountInfo();
    if (accountInfo.success) {
      console.log('✅ Account Info:');
      console.log('   Account SID:', accountInfo.accountSid);
      console.log('   Friendly Name:', accountInfo.friendlyName);
      console.log('   Status:', accountInfo.status);
      console.log('   Type:', accountInfo.type);
    } else {
      console.log('❌ Failed to get account info:', accountInfo.error);
    }
  } catch (error) {
    console.log('❌ Account info error:', error.message);
  }
  console.log('');

  // Test 3: Phone Number Information
  console.log('📋 Test 3: Phone Number Information');
  try {
    const phoneInfo = await sms.getPhoneNumberInfo();
    if (phoneInfo.success) {
      console.log('✅ Phone Number Info:');
      console.log('   Phone Number:', phoneInfo.phoneNumber);
      console.log('   Friendly Name:', phoneInfo.friendlyName);
      console.log('   Capabilities:', JSON.stringify(phoneInfo.capabilities));
      console.log('   Status:', phoneInfo.status);
    } else {
      console.log('❌ Failed to get phone number info:', phoneInfo.error);
    }
  } catch (error) {
    console.log('❌ Phone info error:', error.message);
  }
  console.log('');

  // Test 4: Phone Number Validation
  console.log('📋 Test 4: Phone Number Validation');
  const testNumbers = [
    '+1234567890',  // Valid format
    '1234567890',   // Missing +
    '+abc1234567',  // Invalid characters
    '+1',          // Too short
    '+12345678901234567890' // Too long
  ];

  testNumbers.forEach(number => {
    const validation = sms.validatePhoneNumber(number);
    console.log(`   ${number}: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
    if (!validation.valid) {
      console.log(`      Error: ${validation.error}`);
    }
  });
  console.log('');

  // Test 5: Send Test SMS (uncomment to test)
  console.log('📋 Test 5: Send Test SMS');
  console.log('⚠️  To test SMS sending, uncomment the test code below');
  console.log('⚠️  Make sure you have a valid phone number to receive the test');
  
  /*
  const testPhoneNumber = '+1234567890'; // Replace with your phone number
  try {
    const result = await sms.sendTestAlert(testPhoneNumber);
    console.log('SMS Test Result:', result);
    
    if (result.success && result.messageId) {
      console.log('✅ Test SMS sent successfully!');
      console.log('   Message ID:', result.messageId);
      
      // Check message status after a delay
      setTimeout(async () => {
        const status = await sms.getMessageStatus(result.messageId);
        console.log('📱 Message Status:', status);
      }, 5000);
    } else {
      console.log('❌ SMS test failed:', result.error);
    }
  } catch (error) {
    console.log('❌ SMS test error:', error.message);
  }
  */
  
  console.log('\n🎉 SMS System Test Complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. If SMS service is disabled, check your .env file');
  console.log('2. If account info fails, check your Twilio credentials');
  console.log('3. If phone number info fails, verify your Twilio phone number');
  console.log('4. To test actual SMS sending, uncomment the test code and add your phone number');
  console.log('5. Start the server and use the /api/debug-sms endpoint for live testing');
}

// Run the test
testSMSSystem().catch(console.error);
