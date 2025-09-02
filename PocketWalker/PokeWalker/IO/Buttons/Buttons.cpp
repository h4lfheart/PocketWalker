#include "Buttons.h"

#include "../../../H8/Ssu/Ssu.h"

void Buttons::Press(Button button)
{
    portB |= button;
}

void Buttons::Release(Button button)
{
    portB &= ~button;
}
