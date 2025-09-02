#include "Ssu.h"

#include <ranges>
#include <stdexcept>

#include "../IO/IOComponent.h"

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
            ExecutePeripherals([this](IOComponent* peripheral)
            {
                peripheral->TransmitAndReceive(this);
            });
        }
    }
    else if (enable & SsuFlags::Enable::TRANSMIT_ENABLE)
    {
        if (~status & SsuFlags::Status::TRANSMIT_EMPTY)
        {
            ExecutePeripherals([this](IOComponent* peripheral)
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

void Ssu::RegisterIOPeripheral(Port port, uint8_t pin, IOComponent* component)
{
    if (!peripherals.contains(port)) {
        peripherals[port] = std::map<uint8_t, IOComponent*>();
    }
    
    peripherals[port][pin] = component;
}

uint8_t Ssu::GetPort(uint16_t address)
{
    return ram->ReadByte(address);
}

void Ssu::ExecutePeripherals(const std::function<void(IOComponent* peripheral)>& executeFunction,
                             bool invertPortSelect, bool isTick)
{
    for (const auto& port : peripherals | std::views::keys)
    {
        ExecutePeripherals(port, executeFunction, invertPortSelect, isTick);
    }
}

void Ssu::ExecutePeripherals(const Port port, const std::function<void(IOComponent* peripheral)>& executeFunction,
    bool invertPortSelect, bool isTick)
{
    for (const auto& pins = peripherals[port]; auto [pin, peripheral] : pins)
    {
        const uint8_t currentPortValue = GetPort(port);
            
        uint8_t comparePortValue = peripheral->IsData() ? currentPortValue : ~currentPortValue;
        if (invertPortSelect) comparePortValue = ~comparePortValue;
            
        if (comparePortValue & pin && peripheral->CanExecute(this))
        {
            if (peripheral->IsProgressive() && isTick)
            {
                progress++;

                if (progress == 7)
                {
                    progress = 0;
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
