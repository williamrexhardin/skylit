# Compact navigation

Use the menu button at the top of the left navigation to switch between labels and
an icon-only rail. Navigation buttons retain accessible names and tooltips. Compact
mode hides Momo and suspends its animation; expanding restores it without overriding
native app/background/slideshow pauses. The preference is stored on the frame under
skylit.navigation. Expanded remains the default until the owner chooses compact.

The desktop rail is 72 CSS pixels wide; narrow screens retain a compact wrapping top
bar. Home and YouTube's native dock geometry updates with the rail, without reloading
those service pages. The button always remains visible for expanding navigation.
This preference does not remove Momo settings or alter dashboard layout records.
