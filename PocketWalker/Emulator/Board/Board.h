#pragma once
#include <cstdint>

#include "../Cpu/Cpu.h"
#include "../Memory/Memory.h"
#include "../Peripherals/Accelerometer/Accelerometer.h"
#include "../Peripherals/Eeprom/Eeprom.h"
#include "../Ssu/Ssu.h"

class Cpu;
class Ssu;
class Memory;

class Board
{
public:
    Board(uint8_t* ramBuffer, uint8_t* eepromBuffer)
    {
        ram = new Memory(ramBuffer);
        cpu = new Cpu(ram);
        ssu = new Ssu(ram);

        accelerometer = new Accelerometer();
        ssu->RegisterPeripheral(SsuFlags::Port::PORT_9, Accelerometer::PIN, accelerometer);

        eeprom = new Eeprom(eepromBuffer);
        ssu->RegisterPeripheral(SsuFlags::Port::PORT_1, Eeprom::PIN, eeprom);
    }
 
    void Tick(uint64_t cycles);

    Memory* ram;
    Cpu* cpu;
    Ssu* ssu;
    
    Accelerometer* accelerometer;
    Eeprom* eeprom;
};
