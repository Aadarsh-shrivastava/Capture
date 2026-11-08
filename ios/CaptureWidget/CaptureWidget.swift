import ActivityKit
import SwiftUI
import WidgetKit

// Reads the timeline the app writes (HomeWidgetCapture.setFocusTaskDisplay) from the shared App Group.
private let shared = UserDefaults(suiteName: "group.org.reactjs.native.example.Capture")
private let typeURL = URL(string: "capture://open?mode=type")!
private let voiceURL = URL(string: "capture://open?mode=voice")!
private let cardColor = Color(red: 0.09, green: 0.09, blue: 0.09)

struct FocusEntry: TimelineEntry {
  let date: Date
  let title: String?
  let subtitle: String?
  let mascot: String
}

struct Provider: TimelineProvider {
  /// The current entry (latest one already started), then each later one at its own time.
  private func entries() -> [FocusEntry] {
    let mascot = shared?.string(forKey: "mascot") ?? "male"
    let stored = FocusTimelineEntry.all()
    let now = Date()
    let started = stored.last { $0.date <= now }
    let upcoming = stored.filter { $0.date > now }
    return [FocusEntry(date: now, title: started?.title, subtitle: started?.subtitle, mascot: mascot)]
      + upcoming.map { FocusEntry(date: $0.date, title: $0.title, subtitle: $0.subtitle, mascot: mascot) }
  }

  private func current() -> FocusEntry { entries()[0] }

  func placeholder(in context: Context) -> FocusEntry {
    FocusEntry(date: Date(), title: "Go to gym", subtitle: "Today at 6:00 PM", mascot: "male")
  }

  func getSnapshot(in context: Context, completion: @escaping (FocusEntry) -> Void) {
    completion(context.isPreview ? placeholder(in: context) : current())
  }

  // The app reloads the widget whenever its focus changes; between opens the widget steps through
  // the timeline on its own (a task entering its Now window, going overdue, midnight).
  func getTimeline(in context: Context, completion: @escaping (Timeline<FocusEntry>) -> Void) {
    completion(Timeline(entries: entries(), policy: .after(Date().addingTimeInterval(30 * 60))))
  }
}

private struct Pill: View {
  let label: String
  let icon: String
  var body: some View {
    Label(label, systemImage: icon)
      .font(.caption.weight(.semibold))
      .padding(.horizontal, 10)
      .padding(.vertical, 5)
      .background(Color.white.opacity(0.12), in: Capsule())
  }
}

struct FocusView: View {
  @Environment(\.widgetFamily) private var family
  let entry: FocusEntry

  private var title: String { entry.title ?? "Nothing in focus" }
  private var mascot: Image { Image(entry.mascot == "female" ? "mascot_female" : "mascot_male") }

  var body: some View {
    switch family {
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        Image(systemName: "mic.fill").font(.title3)
      }
      .widgetURL(voiceURL)
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 1) {
        Text("Now").font(.caption2).foregroundStyle(.secondary)
        Text(title).font(.headline).lineLimit(2)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .widgetURL(typeURL)
    case .systemSmall:
      VStack(alignment: .leading, spacing: 4) {
        mascot.resizable().scaledToFit().frame(height: 52)
        Spacer(minLength: 0)
        Text(title).font(.headline).lineLimit(2)
        if let subtitle = entry.subtitle { Text(subtitle).font(.caption).foregroundStyle(.secondary).lineLimit(1) }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .foregroundStyle(.white)
      .widgetURL(typeURL)
    default:
      HStack(spacing: 12) {
        mascot.resizable().scaledToFit().frame(width: 84)
        VStack(alignment: .leading, spacing: 3) {
          Text("NOW").font(.caption2.weight(.bold)).foregroundStyle(.secondary)
          Text(title).font(.headline).lineLimit(2)
          if let subtitle = entry.subtitle { Text(subtitle).font(.caption).foregroundStyle(.secondary).lineLimit(1) }
          Spacer(minLength: 0)
          HStack(spacing: 8) {
            Link(destination: typeURL) { Pill(label: "Type", icon: "keyboard") }
            Link(destination: voiceURL) { Pill(label: "Talk", icon: "mic.fill") }
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
      }
      .foregroundStyle(.white)
      .widgetURL(typeURL)
    }
  }
}

private extension View {
  /// iOS 17 needs containerBackground; earlier versions just get a plain background.
  @ViewBuilder func cardBackground(_ color: Color) -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      containerBackground(color, for: .widget)
    } else {
      padding().background(color)
    }
  }
}

struct CaptureWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "CaptureWidget", provider: Provider()) { entry in
      FocusView(entry: entry).cardBackground(cardColor)
    }
    .configurationDisplayName("Capture")
    .description("Your current task, with one tap to type or talk.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryCircular])
  }
}

private var mascotImage: Image {
  Image(shared?.string(forKey: "mascot") == "female" ? "mascot_female" : "mascot_male")
}

/// Dynamic Island + lock screen banner (Live Activity, started by the app): the current task, tap to talk,
/// long-press for Type / Talk. Stale = a later task may be up now; the app refreshes it on the next open.
@available(iOSApplicationExtension 16.2, *)
struct FocusLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: FocusActivityAttributes.self) { context in
      HStack(spacing: 12) {
        mascotImage.resizable().scaledToFit().frame(width: 52)
        VStack(alignment: .leading, spacing: 3) {
          Text("NOW").font(.caption2.weight(.bold)).foregroundStyle(.secondary)
          Text(context.state.title ?? "Nothing in focus").font(.headline).lineLimit(2)
          if let subtitle = context.isStale ? "Open Capture to refresh" : context.state.subtitle {
            Text(subtitle).font(.caption).foregroundStyle(.secondary).lineLimit(1)
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        VStack(spacing: 8) {
          Link(destination: typeURL) { Pill(label: "Type", icon: "keyboard") }
          Link(destination: voiceURL) { Pill(label: "Talk", icon: "mic.fill") }
        }
      }
      .padding()
      .foregroundStyle(.white)
      .activityBackgroundTint(cardColor)
      .widgetURL(typeURL)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          mascotImage.resizable().scaledToFit().frame(width: 44)
        }
        DynamicIslandExpandedRegion(.center) {
          VStack(alignment: .leading, spacing: 2) {
            Text(context.state.title ?? "Nothing in focus").font(.headline).lineLimit(2)
            if let subtitle = context.isStale ? "Open Capture to refresh" : context.state.subtitle {
              Text(subtitle).font(.caption).foregroundStyle(.secondary).lineLimit(1)
            }
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack(spacing: 8) {
            Link(destination: typeURL) { Pill(label: "Type", icon: "keyboard") }
            Link(destination: voiceURL) { Pill(label: "Talk", icon: "mic.fill") }
          }
        }
      } compactLeading: {
        mascotImage.resizable().scaledToFit().clipShape(Circle())
      } compactTrailing: {
        Text(context.state.title ?? "Capture").font(.caption2).lineLimit(1).frame(maxWidth: 64)
      } minimal: {
        Image(systemName: "mic.fill")
      }
      .widgetURL(voiceURL)
    }
  }
}

/// Lock screen / Control Center / Action button control (iOS 18): capture a thought without unlocking into the app.
@available(iOSApplicationExtension 18.0, *)
struct CaptureControl: ControlWidget {
  var body: some ControlWidgetConfiguration {
    StaticControlConfiguration(kind: "CaptureControl") {
      ControlWidgetButton(action: CaptureThoughtIntent()) {
        Label("Capture", systemImage: "square.and.pencil")
      }
    }
    .displayName("Capture a thought")
  }
}

@main
struct CaptureWidgets: WidgetBundle {
  var body: some Widget {
    CaptureWidget()
    if #available(iOSApplicationExtension 16.2, *) {
      FocusLiveActivityWidget()
    }
    if #available(iOSApplicationExtension 18.0, *) {
      CaptureControl()
    }
  }
}
