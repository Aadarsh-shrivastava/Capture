import AppIntents
import Foundation

/// Thoughts captured outside the app, in the shared App Group; the app reads them on next open
/// (HomeWidgetCapture.peekPendingPrompts) and clears them once saved. Built into both the app and the widget extension.
enum PendingCaptures {
  static let defaults = UserDefaults(suiteName: "group.org.reactjs.native.example.Capture")
  static let key = "pending_prompts"

  static func add(_ text: String) {
    let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return }
    // With the capture time, so "tomorrow" means the day after it was said, not after the app next opens.
    let json = try? JSONSerialization.data(withJSONObject: ["text": trimmed, "at": Date().timeIntervalSince1970 * 1000])
    let entry = json.flatMap { String(data: $0, encoding: .utf8) } ?? trimmed
    defaults?.set((defaults?.stringArray(forKey: key) ?? []) + [entry], forKey: key)
  }
}

/// Say and forget without opening the app: Siri ("Capture in …"), the Action button, Shortcuts, and the
/// lock screen / Control Center control. Asks for the thought (typed or dictated), stores it, done.
@available(iOS 16.0, *)
struct CaptureThoughtIntent: AppIntent {
  static var title: LocalizedStringResource = "Capture a thought"
  static var description = IntentDescription("Save a thought to Capture without opening the app.")
  static var openAppWhenRun = false

  @Parameter(title: "Thought", requestValueDialog: "What's on your mind?")
  var text: String

  func perform() async throws -> some IntentResult & ProvidesDialog {
    PendingCaptures.add(text)
    return .result(dialog: "Captured")
  }
}
