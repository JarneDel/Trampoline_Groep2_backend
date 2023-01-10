char buf[50];

int knop = 14;
const int MPU = 0x68;
float AccX, AccY, AccZ;
bool btnstate = 0;

#include <Wire.h>
#include <ArduinoJson.h>
void setup()
{
    // put your setup code here, to run once:
    Serial.begin(115200);
    pinMode(knop, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(knop), pushbtn, CHANGE);
    Wire.begin();                // Initialize comunication
    Wire.beginTransmission(MPU); // Start communication with MPU6050 // MPU=0x68
    Wire.write(0x6B);            // Talk to the register 6B
    Wire.write(1);
    Wire.endTransmission(true);

    // Configure Accelerometer Sensitivity
    Wire.beginTransmission(MPU);
    Wire.write(0x1C); // Talk to the ACCEL_CONFIG register (1C hex)
    Wire.write(0x00);
    Wire.endTransmission(true);
}

void loop()
{
    Wire.beginTransmission(MPU);
    Wire.write(0x3B);
    Wire.endTransmission(false);
    Wire.requestFrom(MPU, 6, true);

    AccX = (Wire.read() << 8 | Wire.read()) / 16384.0; // X-axis value
    AccY = (Wire.read() << 8 | Wire.read()) / 16384.0; // Y-axis value
    AccZ = (Wire.read() << 8 | Wire.read()) / 16384.0; // Z-axis value

    String json = "{\"AccX\":" + String(AccX) + ",\"AccY\":" + String(AccY) + ",\"AccZ\":" + String(AccZ) + "}";
    Serial.println(json);

    if (btnstate == 1)
    {
        Serial.println("ButtonPush");
        btnstate = 0;
    }
}

void pushbtn()
{
    btnstate = 1;
}