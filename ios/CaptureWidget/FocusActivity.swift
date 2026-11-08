import ActivityKit
import Foundation

/// One step of the app's focus timeline (JSON [{at, title, subtitle}] in the App Group, written by
/// HomeWidgetCapture.setFocusTaskDisplay). Read by the home screen widget and the Live Activity.
struct FocusTimelineEntry: Decodable {
  let at: Double
  let title: String?
  let subtitle: String?

  var date: Date { Date(timeIntervalSince1970: at / 1000) }

  static func all() -> [FocusTimelineEntry] {
    PendingCaptures.defaults?.string(forKey: "focus_timeline")
      .flatMap { try? JSONDecoder().decode([FocusTimelineEntry].self, from: Data($0.utf8)) } ?? []
  }
}

/// Dynamic Island / lock screen Live Activity: the current task, with Type / Talk. Built into both
/// the app (starts and updates it) and the widget extension (draws it).
@available(iOS 16.1, *)
struct FocusActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var title: String?
    var subtitle: String?
  }
}
