package com.capture.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
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

    val title =
      WidgetCaptureStorage.getFocusTitle(context)
        ?: context.getString(R.string.widget_empty_focus)
    views.setTextViewText(R.id.widget_focus_title, title)

    val subtitle = WidgetCaptureStorage.getFocusSubtitle(context)
    if (subtitle != null) {
      views.setTextViewText(R.id.widget_focus_subtitle, subtitle)
      views.setViewVisibility(R.id.widget_focus_subtitle, View.VISIBLE)
    } else {
      views.setViewVisibility(R.id.widget_focus_subtitle, View.GONE)
    }

    val intent = Intent(context, WidgetCaptureActivity::class.java)
    val pendingIntent = PendingIntent.getActivity(
      context,
      appWidgetId,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

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
