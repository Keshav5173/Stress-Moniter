#include <WiFi.h>
#include <WiFiClient.h>
#include <ESPmDNS.h>
#include <Firebase_ESP_Client.h>
#include <math.h>
#define gsr 34

#define API_KEY "AIzaSyD68x_-wiPWQwt1B6qxvmxpvj_bW1B66yo"
#define DATABASE_URL "https://semesterproject-d2098-default-rtdb.asia-southeast1.firebasedatabase.app/" 
#define USER_EMAIL "bhardwajkeshav5173@gmail.com"
#define USER_PASSWORD "keshav@5173"

int gsrPrev = 0;
int N=0;
long int addition = 0;
long int sum=0;

const char *ssid = "Redmi 12 5G";
const char *password = "12345677";

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void setup() {
  Serial.begin(115200);
  pinMode(gsr, INPUT);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.println("");

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.print("Connected to ");
  Serial.println(ssid);

  // Firebase configuration
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Authentication
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  // Initialize Firebase
  Firebase.begin(&config, &auth);

  Firebase.reconnectWiFi(true);
  Serial.println("Firebase initialized");


  
  Serial.println("Activating GSR Senor");
  delay(100);
  Serial.println("Place your fingers in the finger sleeves------");
  delay(500);

}

void loop() {
  int gsrVal = analogRead(gsr);
  N++;
  addition += gsrVal;
  int baseLine = addition/N;
  int add = gsrVal-baseLine;
  add = add*add;
  sum += add;
  float variance = sum/N;
  float standard_deviation = pow(variance, 0.5);
  float focusScore = 100 - standard_deviation;
  float threshold = baseLine +2*standard_deviation;
  float stressPer = ((float)(gsrVal - baseLine) / 2000) * 100;

  if (focusScore > 100) focusScore = 100;
  if (focusScore < 0) focusScore = 0;
  if (stressPer < 0){
    stressPer = 0;
  } 
  else if (stressPer > 100){
    stressPer = 100;
  } 
  if (N >= 500) { // Reset every 1000 readings
    sum = 0;
    addition = 0;
    N = 0;
    add=0;
}

  if (Firebase.ready()) {
    Firebase.RTDB.setFloat(&fbdo, "/GSR-data/GSR_Value", gsrVal);
    Firebase.RTDB.setFloat(&fbdo, "/GSR-data/GSR_Previous_Value", gsrPrev);
    Firebase.RTDB.setFloat(&fbdo, "/GSR-data/baseLine", baseLine);
    Firebase.RTDB.setFloat(&fbdo, "/GSR-data/focus_Score", focusScore);
    Firebase.RTDB.setFloat(&fbdo, "/GSR-data/Stress_Percentage", stressPer);
    Serial.println("Data sent to Firebase");
  }
  Serial.print("GSR Value: ");
  Serial.println(gsrVal);
  Serial.print("Focus Score: ");
  Serial.println(focusScore);
  Serial.print("BaseLine: ");
  Serial.println(baseLine);

  Serial.print("Standard Deviation: ");
  Serial.println(standard_deviation);
  Serial.print("Stress Percentage: ");
  Serial.println(stressPer);
  delay(200);
  gsrPrev = gsrVal;
}
