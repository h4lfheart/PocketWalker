#pragma once
#include <cstdint>

#include "../Cpu/Cpu.h"
#include "../Memory/Memory.h"
#include "../../PokeWalker/IO/Lcd/Lcd.h"
#include "../../PokeWalker/IO/Lcd/LcdData.h"
#include "../Rtc/Rtc.h"
#include "../Adc/Adc.h"
#include "../../PokeWalker/IO/Buttons/Buttons.h"
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
    Board(uint8_t* ramBuffer)
    {
        ram = new Memory(ramBuffer);
        ram->name = "Ram";
        
        cpu = new Cpu(ram);
        ssu = new Ssu(ram, cpu->interrupts, cpu->flags);
        sci3 = new Sci3(ram);
        adc = new Adc(ram);
        timer = new Timer(ram, cpu->interrupts);
        rtc = new Rtc(ram, cpu->interrupts);

    }
 
    void Tick(uint64_t cycles);

    Memory* ram;
    Cpu* cpu;
    Ssu* ssu;
    Sci3* sci3;
    Timer* timer;
    Rtc* rtc;
    Adc* adc;
};
