package com.capture.widget

import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.util.Patterns
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.capture.R

/**
 * "Save to Capture" from any app's share menu, without opening the app: what was shared, an optional note,
 * what it is (to do / read later / remember / just keep) and when. Saved for the app to sort on its next open;
 * the user's picks decide, the model only fills in the rest.
 */
class ShareCaptureActivity : AppCompatActivity() {
  private val kinds = listOf("todo" to R.string.share_kind_todo, "read" to R.string.share_kind_read, "remember" to R.string.share_kind_remember, "keep" to R.string.share_kind_keep)
  /** Said the way you'd say it, so the app reads the date from the words like any capture. */
  private val whens = listOf("today" to R.string.share_when_today, "tonight" to R.string.share_when_tonight, "tomorrow" to R.string.share_when_tomorrow, "this weekend" to R.string.share_when_weekend)

  private var kind: String? = null
  private var whenWords: String? = null
  private var shared = ""
  private lateinit var kindChips: List<TextView>
  private lateinit var whenChips: List<TextView>

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.share_capture_activity)
    window.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

    val text = intent.getStringExtra(Intent.EXTRA_TEXT)?.trim().orEmpty()
    val subject = intent.getStringExtra(Intent.EXTRA_SUBJECT)?.trim().orEmpty()
    // A page title from the sharing app reads better than a bare link.
    shared = listOf(subject, text).filter { it.isNotEmpty() && !(it == subject && text.contains(subject)) }.joinToString("\n")
    if (shared.isEmpty()) return finish()

    val link = Patterns.WEB_URL.matcher(shared).let { if (it.find()) it.group() else null }
    findViewById<TextView>(R.id.share_preview).text = if (link != null && shared.trim() == link) link else shared

    kindChips = kinds.map { (key, label) -> chip(getString(label)) { pickKind(key) } }
    kindChips.forEach { findViewById<LinearLayout>(R.id.share_kinds).addView(it) }
    whenChips = whens.map { (words, label) -> chip(getString(label)) { pickWhen(words) } }
    whenChips.forEach { findViewById<LinearLayout>(R.id.share_whens).addView(it) }

    findViewById<View>(R.id.share_cancel).setOnClickListener { finish() }
    findViewById<View>(R.id.share_save).setOnClickListener { save() }
  }

  private fun pickKind(key: String) {
    kind = if (kind == key) null else key
    val timed = kind == "todo" || kind == "read"
    if (!timed) whenWords = null
    listOf(R.id.share_when_label, R.id.share_whens_scroll).forEach { findViewById<View>(it).visibility = if (timed) View.VISIBLE else View.GONE }
    findViewById<TextView>(R.id.share_caption).setText(if (kind == null) R.string.share_caption_auto else R.string.share_caption_picked)
    refresh()
  }

  private fun pickWhen(words: String) {
    whenWords = if (whenWords == words) null else words
    refresh()
  }

  private fun refresh() {
    kindChips.forEachIndexed { i, chip -> style(chip, kinds[i].first == kind) }
    whenChips.forEachIndexed { i, chip -> style(chip, whens[i].first == whenWords) }
  }

  /** "read this weekend · <note>" first, then what was shared, so the title comes from what you said. */
  private fun save() {
    val note = findViewById<EditText>(R.id.share_note).text?.toString()?.trim().orEmpty()
    val said = listOf(note, whenWords.orEmpty()).filter { it.isNotEmpty() }.joinToString(" ")
    WidgetCaptureStorage.save(this, listOf(said, shared).filter { it.isNotEmpty() }.joinToString("\n"), shared = true, kind = kind)
    window.decorView.performHapticFeedback(
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.CONFIRM else HapticFeedbackConstants.LONG_PRESS,
    )
    Toast.makeText(this, R.string.share_saved, Toast.LENGTH_SHORT).show()
    finish()
  }

  private fun chip(label: String, onTap: () -> Unit): TextView {
    val dp = resources.displayMetrics.density
    return TextView(this).apply {
      text = label
      textSize = 14f
      setPadding((14 * dp).toInt(), (8 * dp).toInt(), (14 * dp).toInt(), (8 * dp).toInt())
      layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { marginEnd = (8 * dp).toInt() }
      setOnClickListener { onTap() }
      style(this, false)
    }
  }

  private fun style(chip: TextView, selected: Boolean) {
    chip.background = GradientDrawable().apply {
      cornerRadius = 100f * resources.displayMetrics.density
      setColor(if (selected) Color.parseColor("#F5F5F5") else Color.parseColor("#2A2A2A"))
    }
    chip.setTextColor(if (selected) Color.parseColor("#0A0A0A") else Color.parseColor("#F5F5F5"))
  }
}
