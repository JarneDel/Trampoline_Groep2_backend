int knop = 14;
bool btnState = 0;
bool btnUpdated = 0;

void setup()
{
    Serial.begin(115200);
    pinMode(knop, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(knop), btnChange, CHANGE);
}

void loop()
{
    btnState = !digitalRead(knop);
    checkBtnState(); // display the button state

}

void checkBtnState(void)
{
    if (btnUpdated)
    {
        Serial.println("{\"ButtonState\":" + String(btnState) + "}");
        btnUpdated = false;
    }
}

void btnChange()
{
  static unsigned long last_interrupt_time = 0;
  unsigned long interrupt_time = millis();
  if (interrupt_time - last_interrupt_time > 10)
  {
    btnState = !digitalRead(knop);
    btnUpdated = true;
  }
  last_interrupt_time = interrupt_time;
}
