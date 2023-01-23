#include <Arduino.h>


#define knop 14
#define led 27
String type = "right";

bool btnUpdated = false;
bool btnState = false;

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
    checkBtnState(); // display the button state
    if (Serial.available() != 0) {
        String readString = Serial.readStringUntil('\n');
        readString.trim();
        if (readString == "IDENTIFY") {
            Serial.println(R"({"id":")" + type + "\"}");
        }

        // button led, sinking OUTPUT
        else if (readString == "ON") {
            digitalWrite(led, LOW);
        }
        else if (readString == "OFF") {
            digitalWrite(led, HIGH);
        }
    }

}