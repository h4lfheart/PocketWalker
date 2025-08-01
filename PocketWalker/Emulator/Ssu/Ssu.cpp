#include "Ssu.h"

#include <ranges>
#include <stdexcept>

#include "../Peripherals/PeripheralComponent.h"

void Ssu::Tick()
{
    if (~enable & SsuFlags::Enable::TRANSMIT_ENABLE)
    {
        status |= SsuFlags::Status::TRANSMIT_EMPTY;
    }

    if (enable & SsuFlags::Enable::TRANSMIT_ENABLE && enable & SsuFlags::Enable::RECEIVE_ENABLE)
    {
        if (~status & SsuFlags::Status::TRANSMIT_EMPTY)
        {
            ExecutePeripherals([this](PeripheralComponent* peripheral)
            {
                peripheral->TransmitAndReceive(this);
            });
        }
    }
    else if (enable & SsuFlags::Enable::TRANSMIT_ENABLE)
    {
        if (~status & SsuFlags::Status::TRANSMIT_EMPTY)
        {
            ExecutePeripherals([this](PeripheralComponent* peripheral)
            {
                peripheral->Transmit(this);
            });
        }
    }
    else if (enable & SsuFlags::Enable::RECEIVE_ENABLE)
    {
        throw std::runtime_error("Unimplemented receive enable for ssu.");
    }
}

void Ssu::RegisterPeripheral(SsuFlags::Port port, uint8_t pin, PeripheralComponent* component)
{
    if (!peripherals.contains(port)) {
        peripherals[port] = std::map<uint8_t, PeripheralComponent*>();
    }
    
    peripherals[port][pin] = component;
}

void Ssu::ExecutePeripherals(const std::function<void(PeripheralComponent* peripheral)>& executeFunction,
    bool invertPortSelect, bool isTick)
{
    for (const auto& port : peripherals | std::views::keys)
    {
        ExecutePeripherals(port, executeFunction, invertPortSelect, isTick);
    }
}

void Ssu::ExecutePeripherals(const SsuFlags::Port port, const std::function<void(PeripheralComponent* peripheral)>& executeFunction,
    bool invertPortSelect, bool isTick)
{
    for (const auto& pins = peripherals[port]; auto [pin, peripheral] : pins)
    {
        const uint8_t currentPortValue = ram->ReadByte(port);
            
        uint8_t comparePortValue = peripheral->IsData() ? currentPortValue : ~currentPortValue;
        if (invertPortSelect) comparePortValue = ~comparePortValue;
            
        if (comparePortValue & pin)
        {
            if (peripheral->IsProgressive() && isTick)
            {
                peripheral->progress++;

                if (peripheral->progress == 7)
                {
                    peripheral->progress = 0;
                    executeFunction(peripheral);
                }
            }
            else
            {
                executeFunction(peripheral);
            }
        }
    }
}
