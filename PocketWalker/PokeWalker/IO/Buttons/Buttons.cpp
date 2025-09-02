#include "Buttons.h"

#include "../../../H8/Ssu/Ssu.h"

void Buttons::Press(const Button button)
{
    portB |= button;
}

void Buttons::Release(const Button button)
{
    portB &= ~button;
}
