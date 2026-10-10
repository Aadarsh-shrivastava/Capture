import Foundation
import React

@objc(HomeWidgetCapture)
class HomeWidgetCapture: NSObject {
  private let storageKey = "capture_pending_widget_prompt"

  @objc
  func getPendingPrompt(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(UserDefaults.standard.string(forKey: storageKey))
  }

  @objc
  func clearPendingPrompt(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    UserDefaults.standard.removeObject(forKey: storageKey)
    resolve(nil)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }
}
