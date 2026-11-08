import UIKit
import ExpoModulesCore
import Expo
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    self.moduleName = "Capture"
    self.dependencyProvider = RCTAppDependencyProvider()

    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]
    // iOS 27 requires the UIScene lifecycle; SceneDelegate builds the window instead.
    self.automaticallyLoadReactNativeWindow = false

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let scene = scene as? UIWindowScene, let app = UIApplication.shared.delegate as? AppDelegate else { return }
    // A cold-start capture:// link becomes Linking.getInitialURL().
    var launchOptions: [AnyHashable: Any] = [:]
    if let url = connectionOptions.urlContexts.first?.url {
      launchOptions[UIApplication.LaunchOptionsKey.url] = url
    }
    let rootView = app.rootViewFactory.view(withModuleName: app.moduleName!, initialProperties: app.initialProps, launchOptions: launchOptions)
    let rootViewController = app.createRootViewController()
    app.setRootView(rootView, toRootViewController: rootViewController)
    let window = UIWindow(windowScene: scene)
    window.rootViewController = rootViewController
    app.window = window
    self.window = window
    window.makeKeyAndVisible()
  }

  // capture:// links (widget Type/Talk buttons, text links) while running → React Native's Linking.
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      RCTLinkingManager.application(UIApplication.shared, open: context.url, options: [:])
    }
  }
}
