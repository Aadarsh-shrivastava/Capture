package com.capture.widget

import android.content.Context

object WidgetCaptureStorage {
  private const val PREFS = "capture_widget"
  private const val KEY_PENDING = "pending_prompt"
  private const val KEY_FOCUS_TITLE = "focus_task_title"
  private const val KEY_FOCUS_SUBTITLE = "focus_task_subtitle"

  fun save(context: Context, text: String) {
    context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_PENDING, text.trim())
      .apply()
  }

  fun getPending(context: Context): String? {
    return context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(KEY_PENDING, null)
      ?.trim()
      ?.takeIf { it.isNotEmpty() }
  }

  fun clear(context: Context) {
    context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .remove(KEY_PENDING)
      .apply()
  }

  fun saveFocusTask(context: Context, title: String?, subtitle: String?) {
    context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_FOCUS_TITLE, title?.trim()?.takeIf { it.isNotEmpty() })
      .putString(KEY_FOCUS_SUBTITLE, subtitle?.trim()?.takeIf { it.isNotEmpty() })
      .apply()
  }

  fun getFocusTitle(context: Context): String? {
    return context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(KEY_FOCUS_TITLE, null)
      ?.trim()
      ?.takeIf { it.isNotEmpty() }
  }

  fun getFocusSubtitle(context: Context): String? {
    return context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(KEY_FOCUS_SUBTITLE, null)
      ?.trim()
      ?.takeIf { it.isNotEmpty() }
  }
}
