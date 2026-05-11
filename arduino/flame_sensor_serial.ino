/*
 * Flame Sensor with Serial Communication
 * Sends data to Python bridge for web monitoring
 * 
 * Hardware:
 * - Arduino Uno
 * - Flame Sensor (digital) -> D3
 * - Red LED -> D13
 * - Green LED -> D11
 * - Buzzer -> D12
 */

int RED_LED = 13;
int GREEN_LED = 11;
int Flame_sensor = 3;
int Flame_detected;
int BUZZER = 12;

void setup() {
  Serial.begin(9600);
  
  pinMode(RED_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(Flame_sensor, INPUT);
  
  // Initialize LEDs
  digitalWrite(RED_LED, LOW);
  digitalWrite(GREEN_LED, HIGH);
  digitalWrite(BUZZER, LOW);
  
  Serial.println("Arduino Flame Sensor Ready");
  Serial.println("SAFE"); // Initial state
}

void loop() {
  Flame_detected = digitalRead(Flame_sensor);
  
  if (Flame_detected == 0) {
    // Fire detected (active LOW sensor)
    Serial.println("ALERT_FIRE");
    
    digitalWrite(RED_LED, HIGH);
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(BUZZER, HIGH);
  }
  else {
    // Safe state
    Serial.println("SAFE");
    
    digitalWrite(RED_LED, LOW);
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(BUZZER, LOW);
  }
  
  delay(1000); // Send data every second
}
