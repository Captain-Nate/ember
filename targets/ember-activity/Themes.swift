import SwiftUI

// Mirror of src/constants/themes.ts — keep the two in sync.
struct EmberTheme {
  let bodyTop: Color
  let bodyMid: Color
  let bodyBottom: Color
  let innerTop: Color
  let innerBottom: Color
  let face: Color
  let accent: Color

  static let background = Color(hex: 0x0B0D14)
  static let inkDim = Color(hex: 0x8E8CA0)
  static let ink = Color(hex: 0xF6EFE2)

  static let all: [String: EmberTheme] = [
    "ember": EmberTheme(
      bodyTop: Color(hex: 0xFFD97A), bodyMid: Color(hex: 0xFF9C3F), bodyBottom: Color(hex: 0xF2552C),
      innerTop: Color(hex: 0xFFF3C2), innerBottom: Color(hex: 0xFFC95B),
      face: Color(hex: 0x46220E), accent: Color(hex: 0xFFB648)
    ),
    "verdant": EmberTheme(
      bodyTop: Color(hex: 0xC4F286), bodyMid: Color(hex: 0x57CE72), bodyBottom: Color(hex: 0x1FA35C),
      innerTop: Color(hex: 0xF0FFCE), innerBottom: Color(hex: 0xA3EA75),
      face: Color(hex: 0x123B22), accent: Color(hex: 0x6FDD8C)
    ),
    "glacier": EmberTheme(
      bodyTop: Color(hex: 0xB3EEFF), bodyMid: Color(hex: 0x4EC5E8), bodyBottom: Color(hex: 0x1F86C2),
      innerTop: Color(hex: 0xE8FBFF), innerBottom: Color(hex: 0x93E1F5),
      face: Color(hex: 0x0B3346), accent: Color(hex: 0x5FD4F2)
    ),
    "amethyst": EmberTheme(
      bodyTop: Color(hex: 0xE3C8FF), bodyMid: Color(hex: 0xAB70F0), bodyBottom: Color(hex: 0x7C3ED8),
      innerTop: Color(hex: 0xF6ECFF), innerBottom: Color(hex: 0xCFA4F8),
      face: Color(hex: 0x2E1354), accent: Color(hex: 0xBB8CF6)
    ),
    "rose": EmberTheme(
      bodyTop: Color(hex: 0xFFC9E0), bodyMid: Color(hex: 0xF877B4), bodyBottom: Color(hex: 0xD6367F),
      innerTop: Color(hex: 0xFFEFF7), innerBottom: Color(hex: 0xFBAFD4),
      face: Color(hex: 0x4A1030), accent: Color(hex: 0xFB8CC3)
    ),
    "sapphire": EmberTheme(
      bodyTop: Color(hex: 0x9DBEFF), bodyMid: Color(hex: 0x5B7BF7), bodyBottom: Color(hex: 0x2E45D4),
      innerTop: Color(hex: 0xE3ECFF), innerBottom: Color(hex: 0x8FA8FB),
      face: Color(hex: 0x101B4E), accent: Color(hex: 0x7C96FA)
    ),
    "moonlight": EmberTheme(
      bodyTop: Color(hex: 0xF4F6FA), bodyMid: Color(hex: 0xC7CEDC), bodyBottom: Color(hex: 0x8E99B0),
      innerTop: Color(hex: 0xFFFFFF), innerBottom: Color(hex: 0xDFE5EF),
      face: Color(hex: 0x2A3040), accent: Color(hex: 0xD5DCE8)
    ),
    "ruby": EmberTheme(
      bodyTop: Color(hex: 0xFF867E), bodyMid: Color(hex: 0xE8232E), bodyBottom: Color(hex: 0x9E0B18),
      innerTop: Color(hex: 0xFFE5E0), innerBottom: Color(hex: 0xFF9C92),
      face: Color(hex: 0x4A0A10), accent: Color(hex: 0xF4525A)
    ),
  ]

  static func named(_ id: String) -> EmberTheme {
    all[id] ?? all["ember"]!
  }
}

extension Color {
  init(hex: UInt32) {
    self.init(
      .sRGB,
      red: Double((hex >> 16) & 0xFF) / 255,
      green: Double((hex >> 8) & 0xFF) / 255,
      blue: Double(hex & 0xFF) / 255,
      opacity: 1
    )
  }
}
