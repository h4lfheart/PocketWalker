#pragma once
#include <cstdint>

#include "../Board/Component.h"
#include "../Memory/Memory.h"
#include "../Memory/MemoryAccessor.h"

class Memory;

namespace AdcFlags
{
    enum Start : uint8_t
    {
        START_CONVERSION = 1 << 7,
    };
}

class Adc : public Component
{
public:
    Adc(Memory* ram) : ram(ram),
        start(ram->CreateAccessor<uint8_t>(START_ADDR)),
        result(ram->CreateAccessor<uint16_t>(RESULT_ADDR))
    {
        ram->OnWrite(START_ADDR, [this](uint8_t)
        {
            if (start & AdcFlags::START_CONVERSION)
            {
                start &= ~AdcFlags::START_CONVERSION;
                result = 0xFFFF; // fake adc value
            }
        });
    }

    MemoryAccessor<uint8_t> start;
    MemoryAccessor<uint16_t> result;

    static constexpr size_t TICKS = 32768;

private:
    Memory* ram;

    static constexpr uint16_t RESULT_ADDR = 0xFFBC;
    static constexpr uint16_t START_ADDR = 0xFFBF;
    
};
