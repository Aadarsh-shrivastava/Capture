package com.capture.widget

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.os.Build
import com.capture.R

/**
 * Pinned "Capture" notification: Type / Talk from the shade and the lock screen, same popup as the widget.
 * ponytail: gone after a reboot until the app is opened again; a BOOT_COMPLETED receiver fixes that if it matters.
 */
object CaptureNotification {
  private const val CHANNEL = "capture_shortcut_visible"
  private const val ID = 4201

  fun show(context: Context) {
    val manager = context.getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      // Default importance so the lock screen shows it (silent ones are hidden there by default); no sound or vibration.
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL, context.getString(R.string.capture_notification_channel), NotificationManager.IMPORTANCE_DEFAULT).apply {
          setSound(null, null)
          enableVibration(false)
          setShowBadge(false)
        },
      )
    }
    fun popup(voice: Boolean, code: Int) = PendingIntent.getActivity(
      context,
      code,
      WidgetCaptureActivity.intent(context, voice),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val type = popup(voice = false, code = 30_001)
    val builder =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Notification.Builder(context, CHANNEL)
      else @Suppress("DEPRECATION") Notification.Builder(context)
    val notification = builder
      .setSmallIcon(android.R.drawable.ic_menu_edit)
      .setContentTitle(context.getString(R.string.capture_notification_title))
      .setContentText(context.getString(R.string.widget_input_hint))
      .setContentIntent(type)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setShowWhen(false)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .addAction(Notification.Action.Builder(null, context.getString(R.string.capture_notification_type), type).build())
      .addAction(Notification.Action.Builder(null, context.getString(R.string.widget_talk_button), popup(voice = true, code = 30_002)).build())
      .build()
    manager.notify(ID, notification)
  }

  fun hide(context: Context) {
    context.getSystemService(NotificationManager::class.java).cancel(ID)
  }
}
