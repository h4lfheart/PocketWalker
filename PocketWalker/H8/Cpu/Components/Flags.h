#pragma once
#include <cstdint>

class Board;

class Flags
{
public:
    union {
        uint8_t ccr = 0;
        struct {
            bool carry : 1;
            bool overflow : 1;
            bool zero : 1;
            bool negative : 1;
            bool user : 1;
            bool halfCarry : 1;
            bool userInterrupt : 1;
            bool interrupt : 1;
        };
    };

    template<typename T>
    void Mov(T value, size_t bits = sizeof(T) * 8)
    {
        const uint32_t negativeMask = NegativeMask(bits);

        negative = value & negativeMask;
        zero = value == 0;
        overflow = false;
    }

    template<typename T>
    void Add(T rdValue, T rsValue, size_t bits = sizeof(T) * 8)
    {
        const uint32_t negativeMask = NegativeMask(bits);
        const uint32_t maxValue = (1 << bits) - 1;
        const uint32_t result = rdValue + rsValue;

        zero = result == 0;
        negative = result & negativeMask;
        overflow = ((rdValue ^ rsValue) & (rdValue ^ result) & negativeMask) != 0;
        carry = result > maxValue;
        halfCarry = ((rdValue ^ rsValue ^ result) >> (bits / 2 - 1) & 1) != 0;
    }
    
    template<typename T>
    void Sub(T rdValue, T rsValue, size_t bits = sizeof(T) * 8)
    {
        const uint32_t negativeMask = NegativeMask(bits);
        const uint32_t result = rdValue - rsValue;

        zero = result == 0;
        negative = result & negativeMask;
        overflow = ((rdValue ^ rsValue) & (rdValue ^ result) & negativeMask) != 0;
        carry = rsValue > rdValue;
        halfCarry = ((rdValue ^ rsValue ^ result) >> (bits / 2 - 1) & 1) != 0;
    }

    template<typename T>
    void Inc(T value, size_t inc, size_t bits = sizeof(T) * 8)
    {
        const uint32_t negativeMask = NegativeMask(bits);
        const uint32_t result = value + inc;
        
        negative = result & negativeMask;
        zero = result == 0;
        overflow = value == (negativeMask >> 1) - 1;
    }

    template<typename T>
    void Dec(T value, size_t dec, size_t bits = sizeof(T) * 8)
    {
        const uint32_t negativeMask = NegativeMask(bits);
        const uint32_t result = value - dec;
        
        negative = result & negativeMask;
        zero = result == 0;
        overflow = value == negativeMask;
    }
    
    static uint32_t NegativeMask(size_t bits)
    {
        return 1 << (bits - 1);   
    }
    
};
