#include <array>
#include <fstream>
#include <ios>
#include <print>

#include "Emulator/PocketWalker.h"

const std::string romPath = "C:/walker.bin";
const std::string eepromPath = "C:/Users/Max/Desktop/eep.rom";

int main(int argc, char* argv[])
{
    try
    {
        std::array<uint8_t, 0xFFFF> romBuffer = {};
        std::ifstream romFile(romPath, std::ios::binary);
        romFile.read(reinterpret_cast<char*>(romBuffer.data()), romBuffer.size());

        
        std::array<uint8_t, 0xFFFF> eepromBuffer = {};
        std::ifstream eepromFile(eepromPath, std::ios::binary);
        eepromFile.read(reinterpret_cast<char*>(eepromBuffer.data()), eepromBuffer.size());
    
        PocketWalker emulator(romBuffer.data(), eepromBuffer.data());
        emulator.Run();
    }
    catch (const std::exception& e)
    {
        std::println("\033[31mERROR: {}\033[0m", e.what());
        return 1;
    }

    return 0;
}
