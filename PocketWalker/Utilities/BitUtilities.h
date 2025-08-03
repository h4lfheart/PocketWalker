#pragma once
#include <vector>

class BitUtilities
{
public:
    static uint8_t BinaryEncodedDecimal(uint8_t number)
    {
        const uint8_t tens = floor(number / 10);
        const uint8_t ones = number % 10;

        return tens * 16 + ones;
    }
    
};
