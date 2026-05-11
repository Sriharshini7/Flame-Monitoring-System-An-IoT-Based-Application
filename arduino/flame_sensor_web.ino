/*
 * Flame Sensor Web Monitoring System
 * Connects to web server and sends real-time fire detection data
 * 
 * Hardware Requirements:
 * - Arduino Uno
 * - Flame Sensor (Analog)
 * - Red LED
 * - White LED  
 * - Buzzer
 * - Ethernet Shield or WiFi Module (ESP8266)
 * 
 * Wiring:
 * - Flame Sensor A0 -> A0
 * - Red LED -> D7
 * - White LED -> D8
 * - Buzzer -> D9
 */

#include <SPI.h>
#include <SoftwareSerial.h>
#include <ESP8266WiFi.h>

// Sensor and actuator pins
#define FLAME_SENSOR A0
#define RED_LED 7
#define WHITE_LED 8
#define BUZZER 9

// Network configuration
const char* ssid = "POCO X5 Pro 5G";
const char* password = "12345t678";
const char* serverHost = "192.168.1.35"; // Your computer's IP address
const int serverPort = 5000;

// Server configuration
const String secretKey = "arduino_secret_key_12345";
const int locationId = 1; // ID of sensor location in database

// Threshold values
const int flameThreshold = 400; // Adjust based on your sensor
const unsigned long sendInterval = 5000; // Send data every 5 seconds
unsigned long lastSendTime = 0;

// WiFi client
WiFiClient client;

void setup() {
  Serial.begin(9600);
  
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
  Serial.println("Connecting to WiFi...");
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
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
    Serial.println("🔥 FLAME DETECTED!");
  } else {
    digitalWrite(RED_LED, LOW);
    digitalWrite(WHITE_LED, HIGH);
    digitalWrite(BUZZER, LOW);
    Serial.println("✅ Safe - No flame detected");
  }
  
  // Send data to server at intervals
  if (currentTime - lastSendTime >= sendInterval) {
    sendDataToServer(sensorValue, flameDetected);
    lastSendTime = currentTime;
  }
  
  // Small delay to prevent overwhelming
  delay(100);
}

void sendDataToServer(int sensorValue, bool flameDetected) {
  if (!client.connect(serverHost, serverPort)) {
    Serial.println("❌ Failed to connect to server");
    return;
  }
  
  // Create JSON payload
  String jsonData = "{";
  jsonData += "\"flame_detected\":" + String(flameDetected ? "true" : "false") + ",";
  jsonData += "\"sensor_value\":" + String(sensorValue) + ",";
  jsonData += "\"temperature\":" + String(readTemperature()) + ",";
  jsonData += "\"humidity\":" + String(readHumidity()) + ",";
  jsonData += "\"location_id\":" + String(locationId) + ",";
  jsonData += "\"secret_key\":\"" + secretKey + "\"";
  jsonData += "}";
  
  // Send HTTP POST request
  client.println("POST /api/incidents HTTP/1.1");
  client.println("Host: " + String(serverHost));
  client.println("Content-Type: application/json");
  client.println("Content-Length: " + String(jsonData.length()));
  client.println("Connection: close");
  client.println();
  client.println(jsonData);
  
  // Wait for response
  delay(100);
  
  // Read response
  while (client.available()) {
    String line = client.readStringUntil('\r');
    Serial.print(line);
  }
  
  client.stop();
  Serial.println("✅ Data sent to server");
}

float readTemperature() {
  // Simulate temperature reading (replace with actual sensor if available)
  return random(20, 35) + (random(0, 100) / 100.0);
}

float readHumidity() {
  // Simulate humidity reading (replace with actual sensor if available)
  return random(40, 80) + (random(0, 100) / 100.0);
}

void testServerConnection() {
  Serial.println("Testing server connection...");
  
  if (client.connect(serverHost, serverPort)) {
    Serial.println("✅ Server connection successful");
    client.stop();
  } else {
    Serial.println("❌ Server connection failed");
    Serial.println("Please check:");
    Serial.println("- Server is running on port " + String(serverPort));
    Serial.println("- Server IP/domain is correct: " + String(serverHost));
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
    }
  }
}
