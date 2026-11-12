import SwiftUI
import UIKit
import UniformTypeIdentifiers

/// "Save to Capture" from any app's share sheet: what you shared and an optional note — saved for the app
/// on its next open (PendingCaptures), into the basket (item type) you tap; the model then only writes the title.
final class ShareViewController: UIViewController {
  override func viewDidLoad() {
    super.viewDidLoad()
    // The whole extension window takes the app's theme; SwiftUI's preferredColorScheme doesn't reach it from here.
    overrideUserInterfaceStyle = appIsLight ? .light : .dark
    view.backgroundColor = .systemBackground
    let model = ShareModel()
    let host = UIHostingController(rootView: ShareView(model: model, done: { [weak self] in self?.close() }))
    addChild(host)
    host.view.frame = view.bounds
    host.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(host.view)
    host.didMove(toParent: self)
    model.load(from: extensionContext?.inputItems as? [NSExtensionItem] ?? [])
  }

  private func close() {
    extensionContext?.completeRequest(returningItems: nil)
  }
}

/// What was shared: plain text and/or a link (the page title, when the app gives one).
final class ShareModel: ObservableObject {
  @Published var text = ""
  @Published var url: URL?

  func load(from items: [NSExtensionItem]) {
    for item in items {
      if let content = item.attributedContentText?.string, !content.isEmpty { set(text: content) }
      for provider in item.attachments ?? [] {
        if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
          provider.loadItem(forTypeIdentifier: UTType.url.identifier) { value, _ in
            if let url = value as? URL, !url.isFileURL { DispatchQueue.main.async { self.url = url } }
          }
        } else if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
          provider.loadItem(forTypeIdentifier: UTType.plainText.identifier) { value, _ in
            if let content = value as? String { DispatchQueue.main.async { self.set(text: content) } }
          }
        }
      }
    }
  }

  private func set(text content: String) {
    // A shared "text" that's just the link is the link.
    if let url = URL(string: content.trimmingCharacters(in: .whitespacesAndNewlines)), url.scheme?.hasPrefix("http") == true {
      self.url = url
    } else if text.isEmpty {
      text = content
    }
  }
}

/// The app's palette (written by HomeWidgetCapture.setTheme): only "light" is light; dark and midnight are dark.
private var appIsLight: Bool {
  UserDefaults(suiteName: "group.org.reactjs.native.example.Capture")?.string(forKey: "theme") == "light"
}

/// The baskets: (type name, label) the app last sent; empty until the app has run once.
private var shareTypes: [(String, String)] {
  guard let json = UserDefaults(suiteName: "group.org.reactjs.native.example.Capture")?.string(forKey: "share_types"),
        let list = try? JSONSerialization.jsonObject(with: Data(json.utf8)) as? [[String: String]] else { return [] }
  return list.compactMap { t in t["name"].map { ($0, t["label"] ?? $0) } }
}

private struct ShareView: View {
  @ObservedObject var model: ShareModel
  let done: () -> Void
  @State private var note = ""
  @State private var saved: String?

  /// The note first, then the shared text and link.
  private var thought: String {
    let shared = [model.text.trimmingCharacters(in: .whitespacesAndNewlines), model.url?.absoluteString ?? ""].filter { !$0.isEmpty }.joined(separator: "\n")
    return [note.trimmingCharacters(in: .whitespacesAndNewlines), shared].filter { !$0.isEmpty }.joined(separator: "\n")
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      ZStack {
        Text("Save to Capture").font(.headline)
        HStack {
          Button("Cancel", action: done).foregroundStyle(.secondary)
          Spacer()
        }
      }

      // What you're sharing.
      VStack(alignment: .leading, spacing: 6) {
        if !model.text.isEmpty {
          Text(model.text).font(.subheadline).lineLimit(4)
        }
        if let url = model.url {
          Label(url.host() ?? url.absoluteString, systemImage: "link").font(.footnote).foregroundStyle(.secondary).lineLimit(1)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(12)
      .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))

      TextField("Add a note (optional)", text: $note, axis: .vertical)
        .lineLimit(1...3)
        .padding(12)
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))

      // Like saving to a playlist: tap a basket and it's saved there. The first row leaves the choice to the model.
      Text("Save to").font(.footnote.weight(.semibold)).foregroundStyle(.secondary)
      ScrollView {
        VStack(spacing: 0) {
          basket(nil, "Let Capture sort it", icon: "sparkles")
          ForEach(shareTypes, id: \.0) { name, label in basket(name, label, icon: "tray") }
        }
      }
    }
    .tint(.primary)
    .padding(20)
    // Fills the whole share sheet (no white page around a small card).
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    .background(Color(.systemBackground))
  }

  private func basket(_ type: String?, _ label: String, icon: String) -> some View {
    Button { save(type, label) } label: {
      HStack(spacing: 12) {
        Image(systemName: icon).frame(width: 24)
        Text(label)
        Spacer()
        if saved == label { Image(systemName: "checkmark") }
      }
      .font(.body)
      .padding(.vertical, 12)
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .disabled(thought.isEmpty || saved != nil)
  }

  private func save(_ type: String?, _ label: String) {
    PendingCaptures.add(thought, shared: true, type: type)
    UINotificationFeedbackGenerator().notificationOccurred(.success)
    saved = label
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5, execute: done)
  }
}
