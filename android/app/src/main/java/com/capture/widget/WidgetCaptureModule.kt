package com.capture.widget

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetCaptureModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "HomeWidgetCapture"

  @ReactMethod
  fun peekPendingPrompts(promise: Promise) {
    val array = Arguments.createArray()
    WidgetCaptureStorage.peekAll(reactContext).forEach { array.pushString(it) }
    promise.resolve(array)
  }

  @ReactMethod
  fun clearPendingPrompts(count: Double, promise: Promise) {
    WidgetCaptureStorage.clear(reactContext, count.toInt())
    promise.resolve(null)
  }

  @ReactMethod
  fun setFocusTaskDisplay(timeline: String, mascot: String?, promise: Promise) {
    WidgetCaptureStorage.saveFocusTimeline(reactContext, timeline)
    WidgetCaptureStorage.saveMascot(reactContext, mascot)
    CaptureWidgetRenderer.updateAll(reactContext)
    promise.resolve(null)
  }

  @ReactMethod
  fun setCaptureNotification(enabled: Boolean, promise: Promise) {
    if (enabled) CaptureNotification.show(reactContext) else CaptureNotification.hide(reactContext)
    promise.resolve(null)
  }

  @ReactMethod
  fun setTheme(theme: String, promise: Promise) {
    WidgetCaptureStorage.saveTheme(reactContext, theme)
    promise.resolve(null)
  }

  @ReactMethod
  fun setShareTypes(json: String, promise: Promise) {
    WidgetCaptureStorage.saveShareTypes(reactContext, json)
    promise.resolve(null)
  }
}
