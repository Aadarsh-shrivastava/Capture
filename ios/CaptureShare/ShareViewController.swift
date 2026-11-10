import SwiftUI
import UIKit
import UniformTypeIdentifiers

/// "Save to Capture" from any app's share sheet: what you shared, an optional note, what it is and when — saved for
/// the app to sort on its next open (PendingCaptures). Your picks decide; the model only fills in the rest.
final class ShareViewController: UIViewController {
  override func viewDidLoad() {
    super.viewDidLoad()
    let model = ShareModel()
    let host = UIHostingController(rootView: ShareView(model: model, done: { [weak self] in self?.close() }))
    addChild(host)
    host.view.frame = view.bounds
    host.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    host.view.backgroundColor = .clear
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

private enum Kind: String, CaseIterable {
  case todo, read, remember, keep
  var label: String {
    switch self {
    case .todo: "To do"
    case .read: "Read later"
    case .remember: "Remember"
    case .keep: "Just keep"
    }
  }
  var icon: String {
    switch self {
    case .todo: "checkmark.circle"
    case .read: "book"
    case .remember: "arrow.uturn.backward.circle"
    case .keep: "tray"
    }
  }
}

/// Spoken the way you'd say it, so the app reads the date from your words like any capture.
private let whens = [("Today", "today"), ("Tonight", "tonight"), ("Tomorrow", "tomorrow"), ("This weekend", "this weekend")]

private struct ShareView: View {
  @ObservedObject var model: ShareModel
  let done: () -> Void
  @State private var note = ""
  @State private var kind: Kind?
  @State private var when: String?
  @State private var saved = false
  @FocusState private var noteFocused: Bool

  /// "read this weekend · <note>" first, then the shared text and link, so the title comes from what you said.
  private var thought: String {
    let said = [note.trimmingCharacters(in: .whitespacesAndNewlines), when ?? ""].filter { !$0.isEmpty }.joined(separator: " ")
    let shared = [model.text.trimmingCharacters(in: .whitespacesAndNewlines), model.url?.absoluteString ?? ""].filter { !$0.isEmpty }.joined(separator: "\n")
    return [said, shared].filter { !$0.isEmpty }.joined(separator: "\n")
  }

  var body: some View {
    VStack(spacing: 0) {
      Spacer(minLength: 0)
      VStack(alignment: .leading, spacing: 16) {
        HStack {
          Button("Cancel", action: done).foregroundStyle(.secondary)
          Spacer()
          Text("Save to Capture").font(.headline)
          Spacer()
          Button(saved ? "Saved" : "Save") { save() }
            .fontWeight(.semibold)
            .disabled(thought.isEmpty || saved)
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
        .background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 14))

        TextField("Add a note (optional)", text: $note, axis: .vertical)
          .lineLimit(1...3)
          .focused($noteFocused)
          .padding(12)
          .background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 14))

        Text("What is it?").font(.footnote.weight(.semibold)).foregroundStyle(.secondary)
        ChipRow(items: Kind.allCases.map { ($0.label, $0.icon, kind == $0) }) { index in
          let picked = Kind.allCases[index]
          kind = kind == picked ? nil : picked
          if kind != .todo && kind != .read { when = nil }
        }

        if kind == .todo || kind == .read {
          Text("When?").font(.footnote.weight(.semibold)).foregroundStyle(.secondary)
          ChipRow(items: whens.map { ($0.0, "calendar", when == $0.1) }) { index in
            when = when == whens[index].1 ? nil : whens[index].1
          }
        }

        Text(kind == nil ? "Capture will work out what it is." : "Capture sorts it the next time you open the app.")
          .font(.caption)
          .foregroundStyle(.tertiary)
      }
      .padding(20)
      .background(Color(white: 0.09), in: RoundedRectangle(cornerRadius: 26))
      .padding(12)
    }
    .preferredColorScheme(.dark)
    .animation(.easeOut(duration: 0.2), value: kind)
  }

  private func save() {
    PendingCaptures.add(thought, shared: true, kind: kind?.rawValue)
    UINotificationFeedbackGenerator().notificationOccurred(.success)
    saved = true
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5, execute: done)
  }
}

/// Wrapping row of pill buttons; `items`: (label, SF Symbol, selected).
private struct ChipRow: View {
  let items: [(String, String, Bool)]
  let onTap: (Int) -> Void

  var body: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: 8) {
        ForEach(items.indices, id: \.self) { index in
          let (label, icon, selected) = items[index]
          Button { onTap(index) } label: {
            Label(label, systemImage: icon)
              .font(.subheadline.weight(.medium))
              .padding(.horizontal, 12)
              .padding(.vertical, 8)
              .background(selected ? Color.white : Color.white.opacity(0.08), in: Capsule())
              .foregroundStyle(selected ? Color.black : Color.white)
          }
          .buttonStyle(.plain)
        }
      }
    }
  }
}
