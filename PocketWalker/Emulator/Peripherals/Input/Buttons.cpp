#include "Buttons.h"

#include "../../Ssu/Ssu.h"

void Buttons::Press(Button button)
{
    ssu->portB |= button;
}

void Buttons::Release(Button button)
{
    ssu->portB &= ~button;
}
