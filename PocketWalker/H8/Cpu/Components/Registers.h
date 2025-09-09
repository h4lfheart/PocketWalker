#pragma once
#include <cstdlib>
#include <cstdint>

#if ANDROID
#include <__algorithm/fill.h>
#endif


class Memory;
class Board;

class Registers
{
public:
    Registers(Memory* ram) : ram(ram)
    {
#if ANDROID
        buffer = static_cast<uint8_t*>(std::aligned_alloc(4, 32));
        std::fill_n(buffer, 32, 0);
#else
        buffer = new uint8_t[32]();
#endif

        sp = Register32(7);
    }

    uint8_t* Register8(const uint8_t control) const;

    uint16_t* Register16(const uint8_t control) const;

    uint32_t* Register32(const uint8_t control) const;

    void PushStack() const;
    uint16_t PopStack() const;

    uint16_t pc;
    uint32_t* sp;

#if !ANDROID
    alignas(uint32_t)
#endif
    uint8_t* buffer;

private:
    Memory* ram;
};
