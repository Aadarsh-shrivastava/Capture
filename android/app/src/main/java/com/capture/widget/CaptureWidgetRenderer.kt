package com.capture.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.os.Build
import android.view.View
import android.widget.RemoteViews
import com.capture.R

object CaptureWidgetRenderer {
  fun update(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
  ) {
    val views = RemoteViews(context.packageName, R.layout.capture_widget)

    val (focusTitle, subtitle) = WidgetCaptureStorage.currentFocus(context)
    views.setTextViewText(R.id.widget_focus_title, focusTitle ?: context.getString(R.string.widget_empty_focus))

    if (subtitle != null) {
      views.setTextViewText(R.id.widget_focus_subtitle, subtitle)
      views.setViewVisibility(R.id.widget_focus_subtitle, View.VISIBLE)
    } else {
      views.setViewVisibility(R.id.widget_focus_subtitle, View.GONE)
    }

    views.setImageViewResource(
      R.id.widget_mascot,
      if (WidgetCaptureStorage.getMascot(context) == "female") R.drawable.widget_mascot_female else R.drawable.widget_mascot_male,
    )

    // Tapping the widget itself opens the app.
    context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { launch ->
      views.setOnClickPendingIntent(
        R.id.widget_root,
        PendingIntent.getActivity(context, appWidgetId + 20_000, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE),
      )
    }

    // Type / Talk: the capture popup, without opening the app (Talk starts dictation right away).
    val typeIntent = PendingIntent.getActivity(
      context,
      appWidgetId,
      WidgetCaptureActivity.intent(context, voice = false),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    views.setOnClickPendingIntent(R.id.widget_type, typeIntent)
    views.setOnClickPendingIntent(
      R.id.widget_talk,
      PendingIntent.getActivity(
        context,
        appWidgetId + 10_000,
        WidgetCaptureActivity.intent(context, voice = true),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      ),
    )

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      views.setViewOutlinePreferredRadius(
        R.id.widget_root,
        28f,
        android.util.TypedValue.COMPLEX_UNIT_DIP,
      )
    }

    appWidgetManager.updateAppWidget(appWidgetId, views)
  }

  fun updateAll(context: Context) {
    val appWidgetManager = AppWidgetManager.getInstance(context)
    val component = android.content.ComponentName(context, CaptureWidgetProvider::class.java)
    val ids = appWidgetManager.getAppWidgetIds(component)
    for (appWidgetId in ids) {
      update(context, appWidgetManager, appWidgetId)
    }
  }
}
