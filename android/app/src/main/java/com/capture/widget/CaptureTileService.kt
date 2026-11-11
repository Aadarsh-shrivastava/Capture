package com.capture.widget

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.os.Build
import android.service.quicksettings.TileService

/** Quick Settings tile ("Capture"): reachable from the lock screen; opens the capture popup over it. */
class CaptureTileService : TileService() {
  @SuppressLint("StartActivityAndCollapseDeprecated")
  override fun onClick() {
    val intent = WidgetCaptureActivity.intent(this, voice = false)
    if (Build.VERSION.SDK_INT >= 34) {
      startActivityAndCollapse(
        PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE),
      )
    } else {
      @Suppress("DEPRECATION")
      startActivityAndCollapse(intent)
    }
  }
}
