#include <Arduino.h>


#define knop 14
#define led 27
String type = "right";

bool btnUpdated = false;
bool btnState = false;

bool ledOn;
unsigned long millisOld = 0;
bool ledState;

void checkBtnState() {
  // check if isr detected a debounced flank
  if (btnUpdated) {
    btnUpdated = false;
    // print the state of the button
    Serial.println("{\"ButtonState\":" + String(btnState) + "}");
  }
}


static unsigned long lastDebounceTime = 0;
static bool lastBtnState = false;
unsigned long debounceDelay = 20;

void btnChange() {
  // update button with 20ms debounce on all flanks in isr

  unsigned long now = millis();
  if (now - lastDebounceTime > debounceDelay) {
    btnState = !digitalRead(knop);
    if (btnState != lastBtnState) {
      lastBtnState = btnState;
      btnUpdated = true;
      lastDebounceTime = millis();
    }
  }
}


void setup() {
  Serial.begin(115200);
  pinMode(knop, INPUT_PULLUP);
  pinMode(led, OUTPUT);
  // High == off (sinking led)
  digitalWrite(led, HIGH);
  attachInterrupt(knop, btnChange, CHANGE);
}


void loop() {
  checkBtnState();  // display the button state
  if (Serial.available() != 0) {
    String readString = Serial.readStringUntil('\n');
    readString.trim();
    if (readString == "IDENTIFY") {
      Serial.println(R"({"id":")" + type + "\"}");
    }
    // button led, sinking OUTPUT
    else if (readString == "ON") {
      ledOn = true;
    } else if (readString == "OFF") {
      ledOn = false;
    }
  }
  if (!ledOn) {
    digitalWrite(led, HIGH);
  } else {
    if (millis() - millisOld > 500) {
      if (ledState) {
        digitalWrite(led, HIGH);
        ledState = false;
      } else {
        digitalWrite(led, LOW);
        ledState = true;
      }
      millisOld = millis();
    }
  }
}