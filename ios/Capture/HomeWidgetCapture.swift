import ActivityKit
import AppIntents
import Foundation
import React
import WidgetKit

@objc(HomeWidgetCapture)
class HomeWidgetCapture: NSObject {
  /// Every thought captured outside the app (Siri, Shortcuts, the control), oldest first. Not removed here:
  /// the app calls clearPendingPrompts once they're in its database, so a crash in between loses nothing.
  @objc
  func peekPendingPrompts(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let list = PendingCaptures.defaults?.stringArray(forKey: PendingCaptures.key) ?? []
    // The old single-slot key, from before the shared list: fold it into the list.
    if let legacy = UserDefaults.standard.string(forKey: "capture_pending_widget_prompt") {
      PendingCaptures.defaults?.set([legacy] + list, forKey: PendingCaptures.key)
      UserDefaults.standard.removeObject(forKey: "capture_pending_widget_prompt")
      return resolve([legacy] + list)
    }
    resolve(list)
  }

  /// Drop the first `count` (the ones the app just saved); thoughts added meanwhile stay.
  @objc
  func clearPendingPrompts(
    _ count: Double,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let list = PendingCaptures.defaults?.stringArray(forKey: PendingCaptures.key) ?? []
    PendingCaptures.defaults?.set(Array(list.dropFirst(Int(count))), forKey: PendingCaptures.key)
    resolve(nil)
  }

  /// Today's focus timeline (JSON [{at, title, subtitle}]) + mascot for the home/lock screen widget
  /// (shared via the App Group), then redraw it.
  @objc
  func setFocusTaskDisplay(
    _ timeline: String,
    mascot: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let shared = UserDefaults(suiteName: "group.org.reactjs.native.example.Capture")
    shared?.set(timeline, forKey: "focus_timeline")
    shared?.set(mascot, forKey: "mascot")
    WidgetCenter.shared.reloadAllTimelines()
    if #available(iOS 16.2, *) { FocusLiveActivity.sync() }
    resolve(nil)
  }

  /// The Dynamic Island / lock screen Live Activity on or off (the "Capture notification" setting).
  @objc
  func setCaptureNotification(
    _ enabled: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    UserDefaults.standard.set(enabled, forKey: FocusLiveActivity.enabledKey)
    if #available(iOS 16.2, *) { FocusLiveActivity.sync() }
    resolve(nil)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }
}

/// Keeps the one Live Activity in step with the setting and the focus timeline. iOS ends it after ~8 hours;
/// the next sync while the app is open (launch, coming back, any change) starts a fresh one.
enum FocusLiveActivity {
  static let enabledKey = "live_activity_enabled"

  @available(iOS 16.2, *)
  static func sync() {
    let running = Activity<FocusActivityAttributes>.activities
    guard UserDefaults.standard.bool(forKey: enabledKey), ActivityAuthorizationInfo().areActivitiesEnabled else {
      for activity in running { Task { await activity.end(nil, dismissalPolicy: .immediate) } }
      return
    }
    // Current entry; the next one is when it goes stale (it can't change by itself without a server push).
    let entries = FocusTimelineEntry.all()
    let now = Date()
    let current = entries.last { $0.date <= now }
    let content = ActivityContent(
      state: FocusActivityAttributes.ContentState(title: current?.title, subtitle: current?.subtitle),
      staleDate: entries.first { $0.date > now }?.date
    )
    if let activity = running.first {
      Task { await activity.update(content) }
    } else {
      // Only works while the app is in the foreground; otherwise it starts on the next open.
      _ = try? Activity.request(attributes: FocusActivityAttributes(), content: content)
    }
  }
}

/// Siri / Spotlight / Action button: "Capture in Capture" asks what's on your mind, by voice, even on the lock screen.
@available(iOS 16.0, *)
struct CaptureShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: CaptureThoughtIntent(),
      phrases: ["Capture in \(.applicationName)", "Add a thought to \(.applicationName)"]
    )
  }
}
