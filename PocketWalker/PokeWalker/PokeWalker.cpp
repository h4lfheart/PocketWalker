#include "PokeWalker.h"

#include "../H8/Ssu/Ssu.h"

PokeWalker::PokeWalker(uint8_t* ramBuffer, uint8_t* eepromBuffer) : H8300H(ramBuffer)
{
    SetupAddressHandlers();

    eeprom = new Eeprom(eepromBuffer);
    RegisterIOComponent(eeprom, Ssu::PORT_1, Ssu::PIN_2);

    accelerometer = new Accelerometer();
    RegisterIOComponent(accelerometer, Ssu::PORT_9, Ssu::PIN_0);

    lcd = new Lcd();
    RegisterIOComponent(lcd, Ssu::PORT_1,Ssu::PIN_0);

    // TODO proper FTIOB and FTIOC usage, just placeholder for now
    // TODO dont use explicit timer w reference
    // TODO output only components need to be handled differently
    beeper = new Beeper(board->timer->w);
    RegisterIOComponent(beeper, Ssu::PORT_8, Ssu::PIN_2);

    // TODO input only components
    // TODO remove explicit portB ref
    // TODO use proper pins for each button instead of generalizing, placeholder for now
    buttons = new Buttons(board->ssu->portB);
    RegisterIOComponent(buttons, Ssu::PORT_B, Ssu::PIN_0);
}

void PokeWalker::Tick(uint64_t cycles)
{
    H8300H::Tick(cycles);

    if (cycles % (Cpu::TICKS / Lcd::TICKS) == 0)
    {
        lcd->Tick();
    }
    
    if (cycles % (Cpu::TICKS / Beeper::TICKS) == 0)
    {
        beeper->Tick();
    }
}

void PokeWalker::OnDraw(const EventHandlerCallback<LcdInformation>& handler) const
{
    lcd->OnDraw += handler;
}

void PokeWalker::OnAudio(const EventHandlerCallback<AudioInformation>& handler) const
{
    beeper->OnPlayAudio += handler;
}

void PokeWalker::OnTransmitSci3(const EventHandlerCallback<std::vector<uint8_t>>& callback) const
{
    board->sci3->OnTransmitPacket += callback;
}

void PokeWalker::ReceiveSci3(const uint8_t byte) const
{
    board->sci3->Receive(byte);
}

void PokeWalker::PressButton(const Buttons::Button button) const
{
    buttons->Press(button);
}

void PokeWalker::ReleaseButton(const Buttons::Button button) const
{
    buttons->Release(button);
}

void PokeWalker::SetEepromBuffer(uint8_t* buffer) const
{
    eeprom->memory->buffer = buffer;
}

uint8_t* PokeWalker::GetEepromBuffer() const
{
    return eeprom->memory->buffer;
}

void PokeWalker::SetupAddressHandlers() const
{
    // add watts
    board->cpu->OnAddress(0x9A4E, [](Cpu* cpu)
    {
        if (cpu->ram->ReadShort(0xF78E) == 0)
        {
            cpu->ram->WriteShort(0xF78E, 1000);
        }

        return Continue;
    });

    // accelerometer sleep TODO proper interrupt?
    board->cpu->OnAddress(0x7700, [](Cpu* cpu)
    {
        cpu->registers->pc += 2;
            
        return SkipInstruction; 
    });

    // hacky ir fix
    board->cpu->OnAddress(0x8EE, [](Cpu* cpu)
    {
        cpu->registers->pc += 2;
            
        return SkipInstruction; 
    });
}
