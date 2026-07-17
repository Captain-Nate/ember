import ActivityKit
import Foundation

// Must match the definition in modules/live-activity (ActivityKit pairs the
// app and extension by this type's name and Codable shape).
struct EmberActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var endAt: Date
    var themeId: String
  }

  var startedAt: Date
}
