package com.capture.widget

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object WidgetCaptureStorage {
  private const val PREFS = "capture_widget"
  private const val KEY_PENDING = "pending_prompt"
  private const val KEY_FOCUS_TIMELINE = "focus_timeline"
  private const val KEY_MASCOT = "mascot_character"

  private const val KEY_QUEUE = "pending_prompts"

  /** Append a thought (widget, lock screen tile, share sheet). The app takes them all on next open. */
  @Synchronized
  fun save(context: Context, text: String) {
    val trimmed = text.trim()
    if (trimmed.isEmpty()) return
    val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val queue = JSONArray(prefs.getString(KEY_QUEUE, "[]"))
    // With the capture time, so "tomorrow" means the day after it was said, not after the app next opens.
    queue.put(JSONObject().put("text", trimmed).put("at", System.currentTimeMillis()).toString())
    // commit, not apply: the popup finishes right after, and a thought must not be lost.
    prefs.edit().putString(KEY_QUEUE, queue.toString()).commit()
  }

  /** Every waiting thought, oldest first. Not removed: the app clears them (clear) once they're in its database. */
  @Synchronized
  fun peekAll(context: Context): List<String> {
    val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val texts = JSONArray(prefs.getString(KEY_QUEUE, "[]")).let { q -> (0 until q.length()).map { q.getString(it) } }
    // The old single-slot key, from before the list: fold it into the list.
    val legacy = prefs.getString(KEY_PENDING, null)?.trim()?.takeIf { it.isNotEmpty() } ?: return texts
    val merged = listOf(legacy) + texts
    prefs.edit().putString(KEY_QUEUE, JSONArray(merged).toString()).remove(KEY_PENDING).commit()
    return merged
  }

  /** Drop the first [count] (the ones the app just saved); thoughts added meanwhile stay. */
  @Synchronized
  fun clear(context: Context, count: Int) {
    val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val queue = JSONArray(prefs.getString(KEY_QUEUE, "[]"))
    val rest = (count until queue.length()).map { queue.getString(it) }
    prefs.edit().putString(KEY_QUEUE, JSONArray(rest).toString()).commit()
  }

  /** JSON [{at, title, subtitle}], oldest first, from the app. */
  fun saveFocusTimeline(context: Context, timeline: String) {
    context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_FOCUS_TIMELINE, timeline)
      .apply()
  }

  /** (title, subtitle) of the latest timeline entry that has started. */
  fun currentFocus(context: Context): Pair<String?, String?> {
    val json = context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(KEY_FOCUS_TIMELINE, null) ?: return null to null
    val entries = runCatching { JSONArray(json) }.getOrNull() ?: return null to null
    val now = System.currentTimeMillis()
    val entry = (0 until entries.length()).map { entries.getJSONObject(it) }.lastOrNull { it.optLong("at") <= now }
      ?: return null to null
    fun text(key: String) = entry.optString(key).trim().takeIf { !entry.isNull(key) && it.isNotEmpty() }
    return text("title") to text("subtitle")
  }

  fun saveMascot(context: Context, character: String?) {
    context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_MASCOT, character)
      .apply()
  }

  fun getMascot(context: Context): String? {
    return context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(KEY_MASCOT, null)
  }
}
