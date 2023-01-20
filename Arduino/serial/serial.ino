#include <Arduino.h>


#define knop 14
String type = "left";

bool btnUpdated = false;
bool btnState = false;

void checkBtnState() {
    // check if isr detected a debounced flank
    if (btnUpdated){
        btnUpdated = false;
        // print the state of the button
        Serial.println("{\"ButtonState\":" + String(btnState) + "}");
    }
}


static unsigned long lastDebounceTime = 0;
static bool lastBtnState = false;
unsigned long debounceDelay = 20;

void btnChange(){
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


void setup()
{
    Serial.begin(115200);
    pinMode(knop, INPUT_PULLUP);
    attachInterrupt(knop, btnChange, CHANGE);
}

void loop()
{
    checkBtnState(); // display the button state
    if (Serial.available() != 0)
    {
        String readString = Serial.readString();
        readString.trim();
        if (readString != "IDENTIFY") return;
        Serial.println(R"({"id":")" + type + "\"}");
    }
}