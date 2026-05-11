/*
 * Simple Flame Sensor Web Monitoring System
 * For Arduino Uno with ESP8266 WiFi Module
 * 
 * Wiring:
 * - Flame Sensor A0 -> A0
 * - Red LED -> D7
 * - White LED -> D8
 * - Buzzer -> D9
 * - ESP8266 TX -> D3 (RX)
 * - ESP8266 RX -> D2 (TX)
 * - ESP8266 VCC -> 3.3V
 * - ESP8266 GND -> GND
 * - ESP8266 CH_PD -> 3.3V
 */

#include <SoftwareSerial.h>

// Sensor and actuator pins
#define FLAME_SENSOR A0
#define RED_LED 7
#define WHITE_LED 8
#define BUZZER 9

// ESP8266 Serial pins
#define ESP_RX 2
#define ESP_TX 3

// Network configuration
const char* ssid = "POCO X5 Pro 5G";
const char* password = "12345t678";
const char* serverHost = "192.168.1.35"; // Your computer's IP
const int serverPort = 5000;

// Server configuration
const String secretKey = "arduino_secret_key_12345";
const int locationId = 1;

// Threshold values
const int flameThreshold = 400; // Adjust based on your sensor
const unsigned long sendInterval = 10000; // Send data every 10 seconds
unsigned long lastSendTime = 0;

// Software serial for ESP8266
SoftwareSerial espSerial(ESP_RX, ESP_TX);

void setup() {
  Serial.begin(9600);
  espSerial.begin(9600);
  
  // Initialize pins
  pinMode(FLAME_SENSOR, INPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(WHITE_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  // Initialize LEDs to safe state
  digitalWrite(RED_LED, LOW);
  digitalWrite(WHITE_LED, HIGH);
  digitalWrite(BUZZER, LOW);
  
  Serial.println("Flame Sensor Web Monitoring System");
  Serial.println("Initializing ESP8266...");
  
  // Reset ESP8266
  espSerial.println("AT+RST");
  delay(2000);
  
  // Connect to WiFi
  connectToWiFi();
  
  // Test server connection
  testServerConnection();
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read flame sensor
  int sensorValue = analogRead(FLAME_SENSOR);
  bool flameDetected = sensorValue < flameThreshold; // Lower value = flame detected
  
  // Control LEDs and buzzer based on flame detection
  if (flameDetected) {
    digitalWrite(RED_LED, HIGH);
    digitalWrite(WHITE_LED, LOW);
    digitalWrite(BUZZER, HIGH);
    Serial.println("🔥 FLAME DETECTED! Sensor: " + String(sensorValue));
  } else {
    digitalWrite(RED_LED, LOW);
    digitalWrite(WHITE_LED, HIGH);
    digitalWrite(BUZZER, LOW);
    Serial.println("✅ Safe - No flame detected. Sensor: " + String(sensorValue));
  }
  
  // Send data to server at intervals
  if (currentTime - lastSendTime >= sendInterval) {
    sendDataToServer(sensorValue, flameDetected);
    lastSendTime = currentTime;
  }
  
  // Small delay to prevent overwhelming
  delay(100);
}

void connectToWiFi() {
  Serial.println("Connecting to WiFi...");
  
  // Set WiFi mode
  espSerial.println("AT+CWMODE=1");
  delay(1000);
  
  // Connect to WiFi network
  String connectCmd = "AT+CWJAP=\"" + String(ssid) + "\",\"" + String(password) + "\"";
  espSerial.println(connectCmd);
  
  // Wait for connection (max 20 seconds)
  long startTime = millis();
  while (millis() - startTime < 20000) {
    if (espSerial.find("OK")) {
      Serial.println("✅ WiFi connected!");
      return;
    }
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n❌ WiFi connection failed");
}

void sendDataToServer(int sensorValue, bool flameDetected) {
  // Create HTTP request
  String jsonData = "{";
  jsonData += "\"flame_detected\":" + String(flameDetected ? "true" : "false") + ",";
  jsonData += "\"sensor_value\":" + String(sensorValue) + ",";
  jsonData += "\"temperature\":" + String(random(20, 35) + (random(0, 100) / 100.0)) + ",";
  jsonData += "\"humidity\":" + String(random(40, 80) + (random(0, 100) / 100.0)) + ",";
  jsonData += "\"location_id\":" + String(locationId) + ",";
  jsonData += "\"secret_key\":\"" + secretKey + "\"";
  jsonData += "}";
  
  // Start TCP connection
  espSerial.println("AT+CIPSTART=\"TCP\",\"" + String(serverHost) + "\"," + String(serverPort));
  delay(2000);
  
  if (espSerial.find("OK")) {
    // Send data length
    String httpRequest = "POST /api/incidents HTTP/1.1\r\n";
    httpRequest += "Host: " + String(serverHost) + "\r\n";
    httpRequest += "Content-Type: application/json\r\n";
    httpRequest += "Content-Length: " + String(jsonData.length()) + "\r\n";
    httpRequest += "Connection: close\r\n\r\n";
    httpRequest += jsonData;
    
    espSerial.println("AT+CIPSEND=" + String(httpRequest.length()));
    delay(1000);
    
    if (espSerial.find(">")) {
      espSerial.print(httpRequest);
      delay(1000);
      
      // Check response
      if (espSerial.find("OK")) {
        Serial.println("✅ Data sent to server successfully");
      } else {
        Serial.println("❌ Failed to send data to server");
      }
    }
    
    // Close connection
    espSerial.println("AT+CIPCLOSE");
  } else {
    Serial.println("❌ Failed to connect to server");
  }
}

void testServerConnection() {
  Serial.println("Testing server connection...");
  
  espSerial.println("AT+CIPSTART=\"TCP\",\"" + String(serverHost) + "\"," + String(serverPort));
  delay(2000);
  
  if (espSerial.find("OK")) {
    Serial.println("✅ Server connection successful");
    espSerial.println("AT+CIPCLOSE");
  } else {
    Serial.println("❌ Server connection failed");
    Serial.println("Please check:");
    Serial.println("- Server is running on port " + String(serverPort));
    Serial.println("- Server IP is correct: " + String(serverHost));
    Serial.println("- Network connectivity");
  }
}

// Optional: Add manual trigger for testing
void serialEvent() {
  if (Serial.available()) {
    String command = Serial.readString();
    command.trim();
    
    if (command == "test") {
      Serial.println("🧪 Testing fire detection...");
      digitalWrite(RED_LED, HIGH);
      digitalWrite(WHITE_LED, LOW);
      digitalWrite(BUZZER, HIGH);
      delay(2000);
      digitalWrite(RED_LED, LOW);
      digitalWrite(WHITE_LED, HIGH);
      digitalWrite(BUZZER, LOW);
      Serial.println("✅ Test completed");
      
      // Send test data
      sendDataToServer(100, true);
    }
  }
}
