long i = 0;
char buf[50];
void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
}

void loop() {
  // put your main code here, to run repeatedly:

  sprintf(buf, "Hello World device 2: %d", i++); 
  Serial.println(buf);
  delay(100);
}