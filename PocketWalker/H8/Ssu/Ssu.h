#pragma once
#include <array>
#include <map>
#include <print>

#include "../Board/Component.h"
#include "../Cpu/Components/Interrupts.h"
#include "../Memory/Memory.h"
#include "../Memory/MemoryAccessor.h"
#include "../IO/IOComponent.h"

class Memory;
class IOComponent;

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

    enum PortB : uint8_t
    {
        IRQ0 = 1 << 0,
        IRQ1 = 1 << 1
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
    enum Port : uint16_t
    {
        PORT_1 = 0xFFD4,
        PORT_3 = 0xFFD6,
        PORT_8 = 0xFFDB,
        PORT_9 = 0xFFDC,
        PORT_B = 0xFFDE,
    };
    
    enum Pin : uint8_t
    {
        PIN_0 = 1 << 0,
        PIN_1 = 1 << 1,
        PIN_2 = 1 << 2,
        PIN_3 = 1 << 3,
        PIN_4 = 1 << 4,
        PIN_5 = 1 << 5,
    };
    
    Ssu(Memory* ram, Interrupts* interrupts, Flags* flags) : ram(ram), interrupts(interrupts), flags(flags),
        mode(ram->CreateAccessor<uint8_t>(MODE_ADDR)),
        enable(ram->CreateAccessor<uint8_t>(ENABLE_ADDR)),
        status(ram->CreateAccessor<uint8_t>(STATUS_ADDR)),
        transmit(ram->CreateAccessor<uint8_t>(TRANSMIT_ADDR)),
        receive(ram->CreateAccessor<uint8_t>(RECEIVE_ADDR)),
        port1(ram->CreateAccessor<uint8_t>(PORT_1)),
        port3(ram->CreateAccessor<uint8_t>(PORT_3)),
        port8(ram->CreateAccessor<uint8_t>(PORT_8)),
        port9(ram->CreateAccessor<uint8_t>(PORT_9)),
        portB(ram->CreateAccessor<uint8_t>(PORT_B))
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
        
        ram->OnWrite(PORT_1, [this](uint32_t)
        {
            ExecutePeripherals(PORT_1, [](IOComponent* peripheral)
            {
                peripheral->Reset();
            }, true, false);
        });
        
        ram->OnWrite(PORT_9, [this](uint32_t)
        {
            ExecutePeripherals(PORT_9, [](IOComponent* peripheral)
            {
                peripheral->Reset();
            }, true, false);
        });
        
        ram->OnWrite(PORT_B, [this](uint32_t port)
        {
            if (port & SsuFlags::PortB::IRQ0)
            {
                if (!this->flags->interrupt)
                {
                    this->interrupts->flag1 |= InterruptFlags::Flag1::FLAG_IRQ0;
                }
            }
        });
    }

    void Tick() override;

    void RegisterIOPeripheral(Port port, uint8_t pin, IOComponent* component);

    uint8_t GetPort(uint16_t address);

    size_t clockRate = 4;
    uint8_t progress;
    
    MemoryAccessor<uint8_t> mode;
    MemoryAccessor<uint8_t> enable;
    MemoryAccessor<uint8_t> status;
    MemoryAccessor<uint8_t> transmit;
    MemoryAccessor<uint8_t> receive;
    
    MemoryAccessor<uint8_t> port1;
    MemoryAccessor<uint8_t> port3;
    MemoryAccessor<uint8_t> port8;
    MemoryAccessor<uint8_t> port9;
    MemoryAccessor<uint8_t> portB;

private:
    void ExecutePeripherals(const std::function<void(IOComponent* peripheral)>& executeFunction, bool invertPortSelect = false, bool isTick = true);
    void ExecutePeripherals(Port port, const std::function<void(IOComponent* peripheral)>& executeFunction, bool invertPortSelect = false, bool isTick = true);
    
    Memory* ram;
    Flags* flags;
    Interrupts* interrupts;

    std::map<Port, std::map<uint8_t, IOComponent*>> peripherals;
};
