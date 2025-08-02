#pragma once
#include <array>
#include <map>

#include "../Board/Component.h"
#include "../Memory/Memory.h"
#include "../Memory/MemoryAccessor.h"
#include "../Peripherals/PeripheralComponent.h"

class Memory;
class PeripheralComponent;

constexpr uint16_t MODE_ADDR = 0xF0E2;
constexpr uint16_t ENABLE_ADDR = 0xF0E3;
constexpr uint16_t STATUS_ADDR = 0xF0E4;
constexpr uint16_t RECEIVE_ADDR = 0xF0E9;
constexpr uint16_t TRANSMIT_ADDR = 0xF0EB;

namespace SsuFlags
{
    enum Enable : uint8_t
    {
        TRANSMIT_ENABLE = 1 << 7,
        RECEIVE_ENABLE = 1 << 6
    };
    
    enum Status : uint8_t
    {
        TRANSMIT_END = 1 << 3,
        TRANSMIT_EMPTY = 1 << 2,
        RECEIVE_FULL = 1 << 1
    };

    enum Port : uint16_t
    {
        PORT_1 = 0xFFD4,
        PORT_3 = 0xFFD6,
        PORT_8 = 0xFFDB,
        PORT_9 = 0xFFDC,
        PORT_B = 0xFFDE,
    };
}

constexpr std::array clockRates = {
    256,
    128,
    64,
    32,
    16,
    8,
    4,
    2
};

class Ssu : public Component
{
public:
    Ssu(Memory* ram) : ram(ram),
        mode(ram->CreateAccessor<uint8_t>(MODE_ADDR)),
        enable(ram->CreateAccessor<uint8_t>(ENABLE_ADDR)),
        status(ram->CreateAccessor<uint8_t>(STATUS_ADDR)),
        transmit(ram->CreateAccessor<uint8_t>(TRANSMIT_ADDR)),
        receive(ram->CreateAccessor<uint8_t>(RECEIVE_ADDR))
    {
        ram->OnRead(RECEIVE_ADDR, [this](uint32_t)
        {
            status &= ~SsuFlags::Status::RECEIVE_FULL;
        });
        
        ram->OnWrite(TRANSMIT_ADDR, [this](uint32_t)
        {
            status &= ~SsuFlags::Status::TRANSMIT_EMPTY;
            status &= ~SsuFlags::Status::TRANSMIT_END;
        });

        ram->OnWrite(MODE_ADDR, [this](uint32_t mode)
        {
            clockRate = clockRates[mode & 0b111];
        });
        
        ram->OnWrite(SsuFlags::Port::PORT_1, [this](uint32_t)
        {
            ExecutePeripherals(SsuFlags::Port::PORT_1, [](PeripheralComponent* peripheral)
            {
                peripheral->Reset();
            }, true, false);
        });
        
        ram->OnWrite(SsuFlags::Port::PORT_9, [this](uint32_t)
        {
            ExecutePeripherals(SsuFlags::Port::PORT_9, [](PeripheralComponent* peripheral)
            {
                peripheral->Reset();
            }, true, false);
        });
    }

    void Tick() override;

    void RegisterPeripheral(SsuFlags::Port port, uint8_t pin, PeripheralComponent* component);

    size_t clockRate = 4;
    
    MemoryAccessor<uint8_t> mode;
    MemoryAccessor<uint8_t> enable;
    MemoryAccessor<uint8_t> status;
    MemoryAccessor<uint8_t> transmit;
    MemoryAccessor<uint8_t> receive;

private:
    void ExecutePeripherals(const std::function<void(PeripheralComponent* peripheral)>& executeFunction, bool invertPortSelect = false, bool isTick = true);
    void ExecutePeripherals(SsuFlags::Port port, const std::function<void(PeripheralComponent* peripheral)>& executeFunction, bool invertPortSelect = false, bool isTick = true);
    
    Memory* ram;

    std::map<SsuFlags::Port, std::map<uint8_t, PeripheralComponent*>> peripherals;
};
