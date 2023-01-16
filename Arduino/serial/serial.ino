int knop = 14;
bool lastState = 1;
bool btnState;

void setup()
{
    Serial.begin(115200); // set baud rate to 19200 for serial transmission
    pinMode(knop, INPUT_PULLUP);
}

void loop()
{
    checkBtnState(); // display the button state
}

void checkBtnState(void)
{
    btnState = digitalRead(knop);
    if (btnState != lastState)
    {
        Serial.println("{\"ButtonState\":" + String(!btnState) + "}");
        lastState = btnState;
    }
}
