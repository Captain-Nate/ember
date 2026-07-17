import ActivityKit
import SwiftUI
import WidgetKit

@main
struct EmberWidgets: WidgetBundle {
  var body: some Widget {
    EmberLiveActivity()
  }
}

struct EmberLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: EmberActivityAttributes.self) { context in
      LockScreenView(context: context)
        .activityBackgroundTint(EmberTheme.background)
        .activitySystemActionForegroundColor(EmberTheme.named(context.state.themeId).accent)
    } dynamicIsland: { context in
      let theme = EmberTheme.named(context.state.themeId)
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 8) {
            FlameView(theme: theme, size: 32)
            Text("Ember")
              .font(.system(size: 15, weight: .semibold))
              .foregroundStyle(EmberTheme.ink)
          }
          .padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.trailing) {
          TimerText(context: context, size: 24)
            .padding(.trailing, 4)
        }
        DynamicIslandExpandedRegion(.bottom) {
          if context.isStale {
            Text("Session complete — a new candle is lit")
              .font(.system(size: 13))
              .foregroundStyle(EmberTheme.inkDim)
          } else {
            ProgressView(
              timerInterval: context.attributes.startedAt...context.state.endAt,
              countsDown: false, label: { EmptyView() }, currentValueLabel: { EmptyView() }
            )
            .progressViewStyle(.linear)
            .tint(theme.accent)
            .padding(.horizontal, 4)
          }
        }
      } compactLeading: {
        FlameView(theme: theme, size: 16, showFace: false)
      } compactTrailing: {
        if context.isStale {
          Image(systemName: "checkmark")
            .foregroundStyle(theme.accent)
        } else {
          Text(timerInterval: Date()...context.state.endAt, countsDown: true)
            .font(.system(size: 13, weight: .semibold))
            .monospacedDigit()
            .foregroundStyle(theme.accent)
            .frame(maxWidth: 46)
            .minimumScaleFactor(0.7)
            .multilineTextAlignment(.trailing)
        }
      } minimal: {
        FlameView(theme: theme, size: 14, showFace: false)
      }
      .keylineTint(theme.accent)
    }
  }
}

struct TimerText: View {
  let context: ActivityViewContext<EmberActivityAttributes>
  let size: CGFloat

  var body: some View {
    Text(timerInterval: Date()...context.state.endAt, countsDown: true)
      .font(.system(size: size, weight: .light))
      .monospacedDigit()
      .foregroundStyle(EmberTheme.ink)
      .multilineTextAlignment(.trailing)
  }
}

struct LockScreenView: View {
  let context: ActivityViewContext<EmberActivityAttributes>

  var body: some View {
    let theme = EmberTheme.named(context.state.themeId)
    HStack(spacing: 14) {
      FlameView(theme: theme, size: 44)
      VStack(alignment: .leading, spacing: 3) {
        Text(context.isStale ? "Session complete" : "Ember is burning")
          .font(.system(size: 15, weight: .semibold))
          .foregroundStyle(EmberTheme.ink)
        Text(context.isStale ? "A new candle is lit" : "Stay with it")
          .font(.system(size: 12))
          .foregroundStyle(EmberTheme.inkDim)
      }
      Spacer()
      VStack(alignment: .trailing, spacing: 6) {
        if context.isStale {
          Image(systemName: "checkmark.circle.fill")
            .font(.system(size: 26))
            .foregroundStyle(theme.accent)
        } else {
          TimerText(context: context, size: 28)
            .frame(maxWidth: 96)
          ProgressView(
            timerInterval: context.attributes.startedAt...context.state.endAt,
            countsDown: false, label: { EmptyView() }, currentValueLabel: { EmptyView() }
          )
          .progressViewStyle(.linear)
          .tint(theme.accent)
          .frame(width: 96)
        }
      }
    }
    .padding(16)
  }
}
