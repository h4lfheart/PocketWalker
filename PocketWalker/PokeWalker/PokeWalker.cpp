#include "PokeWalker.h"

#include "../H8/Ssu/Ssu.h"

PokeWalker::PokeWalker(uint8_t* ramBuffer, uint8_t* eepromBuffer) : H8300H(ramBuffer)
{
    SetupAddressHandlers();

    eeprom = new Eeprom(eepromBuffer);
    RegisterIOComponent(eeprom, Ssu::PORT_1, Ssu::PIN_2);

    accelerometer = new Accelerometer();
    RegisterIOComponent(accelerometer, Ssu::PORT_9, Ssu::PIN_0);

    // todo combine lcd into one component with multiple pins
    lcd = new Lcd();
    RegisterIOComponent(lcd, Ssu::PORT_1,Ssu::PIN_0);
    
    lcdData = new LcdData(lcd);
    RegisterIOComponent(lcdData, Ssu::PORT_1, Ssu::PIN_1);

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

void PokeWalker::OnDraw(std::function<void(uint8_t*)> handler) const
{
    lcd->onDraw = handler;
}

void PokeWalker::OnAudio(std::function<void(float)> handler) const
{
    beeper->renderAudio = handler;
}

void PokeWalker::PressButton(Buttons::Button button) const
{
    buttons->Press(button);
}

void PokeWalker::ReleaseButton(Buttons::Button button) const
{
    buttons->Press(button);
}

void PokeWalker::SetEepromBuffer(uint8_t* buffer)
{
    eeprom->memory->buffer = buffer;
}

uint8_t* PokeWalker::GetEepromBuffer()
{
    return eeprom->memory->buffer;
}

void PokeWalker::SetupAddressHandlers()
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

    // cleanup input
    /*board->cpu->OnAddress(0x9C3E, [](Cpu* cpu)
    {
        if (cpu->ram->ReadByte(0xFFDE) != 0)
        {
            cpu->ram->WriteByte(0xFFDE, 0);
        }
        
        return Continue;
    });*/

    // factory tests
    board->cpu->OnAddress(0x336, [](Cpu* cpu)
    {
        cpu->registers->pc += 4;
            
        return SkipInstruction; 
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
