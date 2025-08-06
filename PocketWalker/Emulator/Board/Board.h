#pragma once
#include <cstdint>

#include "../Cpu/Cpu.h"
#include "../Memory/Memory.h"
#include "../Peripherals/Accelerometer/Accelerometer.h"
#include "../Peripherals/Eeprom/Eeprom.h"
#include "../Peripherals/Lcd/Lcd.h"
#include "../Peripherals/Lcd/LcdData.h"
#include "../Rtc/Rtc.h"
#include "../Adc/Adc.h"
#include "../Sci3/Sci3.h"
#include "../Ssu/Ssu.h"
#include "../Timers/Timer.h"

class Adc;
class Lcd;
class Cpu;
class Ssu;
class Memory;

class Board
{
public:
    Board(uint8_t* ramBuffer, uint8_t* eepromBuffer)
    {
        ram = new Memory(ramBuffer);
        ram->name = "Ram";
        cpu = new Cpu(ram);
        ssu = new Ssu(ram);
        sci3 = new Sci3(ram);
        adc = new Adc(ram);
        timer = new Timer(ram, cpu->interrupts);
        rtc = new Rtc(ram, cpu->interrupts);

        accelerometer = new Accelerometer();
        ssu->RegisterPeripheral(SsuFlags::Port::PORT_9, Accelerometer::PIN, accelerometer);

        eeprom = new Eeprom(eepromBuffer);
        ssu->RegisterPeripheral(SsuFlags::Port::PORT_1, Eeprom::PIN, eeprom);

        lcd = new Lcd();
        ssu->RegisterPeripheral(SsuFlags::Port::PORT_1, Lcd::PIN, lcd);

        lcdData = new LcdData(lcd);
        ssu->RegisterPeripheral(SsuFlags::Port::PORT_1, LcdData::PIN, lcdData);

    }
 
    void Tick(uint64_t cycles);

    std::function<void(float)> renderAudio;

    Memory* ram;
    Cpu* cpu;
    Ssu* ssu;
    Sci3* sci3;
    Timer* timer;
    Rtc* rtc;
    Adc* adc;
    
    Accelerometer* accelerometer;
    Eeprom* eeprom;
    Lcd* lcd;
    LcdData* lcdData;
};
