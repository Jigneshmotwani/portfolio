/**
 * Widget sizes follow iOS: small = 2×2 icons (≈158pt square on iPhone),
 * medium = 4×2, large = 4×4. On macOS the same sizes are used on the desktop
 * (small 170×170, medium 360×170, large 360×380 px).
 */
export type WidgetSize = 'small' | 'medium' | 'large'

export interface WidgetProps {
  size: WidgetSize
  platform: 'mac' | 'ios'
}
