package com.capture.widget

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class WidgetCaptureModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "HomeWidgetCapture"

  @ReactMethod
  fun getPendingPrompt(promise: Promise) {
    promise.resolve(WidgetCaptureStorage.getPending(reactContext))
  }

  @ReactMethod
  fun clearPendingPrompt(promise: Promise) {
    WidgetCaptureStorage.clear(reactContext)
    promise.resolve(null)
  }

  @ReactMethod
  fun setFocusTaskDisplay(title: String?, subtitle: String?, promise: Promise) {
    WidgetCaptureStorage.saveFocusTask(reactContext, title, subtitle)
    CaptureWidgetRenderer.updateAll(reactContext)
    promise.resolve(null)
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for NativeEventEmitter on Android.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for NativeEventEmitter on Android.
  }

  companion object {
    const val SUBMIT_EVENT = "HomeWidgetCaptureSubmit"

    fun emitSubmit(reactContext: ReactApplicationContext) {
      if (!reactContext.hasActiveReactInstance()) {
        return
      }
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(SUBMIT_EVENT, null)
    }
  }
}
