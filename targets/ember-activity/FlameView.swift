import SwiftUI

// Vector Ember — the same teardrop drawn in src/components/flame.tsx,
// with the focused (narrow-eyed, smiling) face. Static by iOS rule:
// Live Activities cannot animate.

struct FlameOuterShape: Shape {
  func path(in rect: CGRect) -> Path {
    let w = rect.width
    let h = rect.height
    var p = Path()
    p.move(to: CGPoint(x: 0.5 * w, y: 0.075 * h))
    p.addCurve(
      to: CGPoint(x: 0.175 * w, y: 0.65 * h),
      control1: CGPoint(x: 0.478 * w, y: 0.25 * h),
      control2: CGPoint(x: 0.175 * w, y: 0.40 * h))
    p.addCurve(
      to: CGPoint(x: 0.5 * w, y: 0.942 * h),
      control1: CGPoint(x: 0.175 * w, y: 0.842 * h),
      control2: CGPoint(x: 0.321 * w, y: 0.942 * h))
    p.addCurve(
      to: CGPoint(x: 0.825 * w, y: 0.65 * h),
      control1: CGPoint(x: 0.679 * w, y: 0.942 * h),
      control2: CGPoint(x: 0.825 * w, y: 0.842 * h))
    p.addCurve(
      to: CGPoint(x: 0.5 * w, y: 0.075 * h),
      control1: CGPoint(x: 0.825 * w, y: 0.40 * h),
      control2: CGPoint(x: 0.522 * w, y: 0.25 * h))
    p.closeSubpath()
    return p
  }
}

struct FlameInnerShape: Shape {
  func path(in rect: CGRect) -> Path {
    let w = rect.width
    let h = rect.height
    var p = Path()
    p.move(to: CGPoint(x: 0.5 * w, y: 0.325 * h))
    p.addCurve(
      to: CGPoint(x: 0.310 * w, y: 0.675 * h),
      control1: CGPoint(x: 0.483 * w, y: 0.433 * h),
      control2: CGPoint(x: 0.310 * w, y: 0.508 * h))
    p.addCurve(
      to: CGPoint(x: 0.5 * w, y: 0.858 * h),
      control1: CGPoint(x: 0.310 * w, y: 0.80 * h),
      control2: CGPoint(x: 0.399 * w, y: 0.858 * h))
    p.addCurve(
      to: CGPoint(x: 0.690 * w, y: 0.675 * h),
      control1: CGPoint(x: 0.601 * w, y: 0.858 * h),
      control2: CGPoint(x: 0.690 * w, y: 0.80 * h))
    p.addCurve(
      to: CGPoint(x: 0.5 * w, y: 0.325 * h),
      control1: CGPoint(x: 0.690 * w, y: 0.508 * h),
      control2: CGPoint(x: 0.517 * w, y: 0.433 * h))
    p.closeSubpath()
    return p
  }
}

struct FlameSmileShape: Shape {
  func path(in rect: CGRect) -> Path {
    let w = rect.width
    let h = rect.height
    var p = Path()
    p.move(to: CGPoint(x: 0.422 * w, y: 0.733 * h))
    p.addQuadCurve(
      to: CGPoint(x: 0.578 * w, y: 0.733 * h),
      control: CGPoint(x: 0.5 * w, y: 0.779 * h))
    return p
  }
}

struct FlameView: View {
  let theme: EmberTheme
  let size: CGFloat
  var showFace: Bool = true

  var body: some View {
    ZStack {
      FlameOuterShape()
        .fill(
          LinearGradient(
            colors: [theme.bodyTop, theme.bodyMid, theme.bodyBottom],
            startPoint: .top, endPoint: .bottom))
      FlameInnerShape()
        .fill(
          LinearGradient(
            colors: [theme.innerTop, theme.innerBottom],
            startPoint: .top, endPoint: .bottom))
        .opacity(0.9)
      if showFace {
        Capsule()
          .fill(theme.face)
          .frame(width: 0.075 * size, height: 0.062 * size * 1.2)
          .offset(x: -0.123 * size, y: (0.6167 - 0.5) * size * 1.2)
        Capsule()
          .fill(theme.face)
          .frame(width: 0.075 * size, height: 0.062 * size * 1.2)
          .offset(x: 0.123 * size, y: (0.6167 - 0.5) * size * 1.2)
        FlameSmileShape()
          .stroke(theme.face, style: StrokeStyle(lineWidth: max(1.4, 0.025 * size), lineCap: .round))
      }
    }
    .frame(width: size, height: size * 1.2)
  }
}
