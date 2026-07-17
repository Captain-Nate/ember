import ActivityKit
import ExpoModulesCore

// Must match the definition in targets/ember-activity/Attributes.swift
// (ActivityKit pairs app and extension by this type's name and Codable shape).
struct EmberActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var endAt: Date
    var themeId: String
  }

  var startedAt: Date
}

public class LiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("EmberLiveActivity")

    Function("start") { (endAtMs: Double, startedAtMs: Double, themeId: String) -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      guard ActivityAuthorizationInfo().areActivitiesEnabled else { return false }

      // Capture stragglers before requesting so the cleanup can't kill the new one.
      let stale = Activity<EmberActivityAttributes>.activities
      let attributes = EmberActivityAttributes(
        startedAt: Date(timeIntervalSince1970: startedAtMs / 1000))
      let state = EmberActivityAttributes.ContentState(
        endAt: Date(timeIntervalSince1970: endAtMs / 1000),
        themeId: themeId)
      do {
        _ = try Activity.request(
          attributes: attributes,
          content: .init(state: state, staleDate: state.endAt))
      } catch {
        return false
      }
      Task {
        for activity in stale {
          await activity.end(nil, dismissalPolicy: .immediate)
        }
      }
      return true
    }

    Function("end") {
      guard #available(iOS 16.2, *) else { return }
      let activities = Activity<EmberActivityAttributes>.activities
      Task {
        for activity in activities {
          await activity.end(nil, dismissalPolicy: .immediate)
        }
      }
    }
  }
}
