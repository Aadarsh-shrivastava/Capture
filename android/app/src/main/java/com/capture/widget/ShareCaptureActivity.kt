package com.capture.widget

import android.content.Intent
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
import androidx.appcompat.app.AppCompatDelegate
import com.capture.R

/**
 * "Save to Capture" from any app's share menu, without opening the app: what was shared, an optional note, and the
 * basket (item type) to put it in. Saved for the app on its next open, where the model only writes the title — or,
 * with "Let Capture sort it", works out the type too.
 */
class ShareCaptureActivity : AppCompatActivity() {
  private var shared = ""

  override fun onCreate(savedInstanceState: Bundle?) {
    // Match the app's theme, not the phone's (values / values-night colours).
    delegate.localNightMode = if (WidgetCaptureStorage.isLightTheme(this)) AppCompatDelegate.MODE_NIGHT_NO else AppCompatDelegate.MODE_NIGHT_YES
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

    findViewById<View>(R.id.share_cancel).setOnClickListener { finish() }
    // Like saving to a playlist: tap a basket and it's saved there. The first row leaves the choice to the model.
    val baskets = findViewById<LinearLayout>(R.id.share_baskets)
    baskets.addView(row(getString(R.string.share_auto)) { save(null) })
    WidgetCaptureStorage.shareTypes(this).forEach { (name, label) -> baskets.addView(row(label) { save(name) }) }
  }

  private fun row(label: String, onTap: () -> Unit): TextView {
    val dp = resources.displayMetrics.density
    return TextView(this).apply {
      text = label
      textSize = 16f
      setTextColor(getColor(R.color.share_text))
      setPadding((4 * dp).toInt(), (14 * dp).toInt(), (4 * dp).toInt(), (14 * dp).toInt())
      layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
      setOnClickListener { onTap() }
    }
  }

  /** The note first, then what was shared. `type`: the basket picked, or null to let the model sort it. */
  private fun save(type: String?) {
    val note = findViewById<EditText>(R.id.share_note).text?.toString()?.trim().orEmpty()
    WidgetCaptureStorage.save(this, listOf(note, shared).filter { it.isNotEmpty() }.joinToString("\n"), shared = true, type = type)
    window.decorView.performHapticFeedback(
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.CONFIRM else HapticFeedbackConstants.LONG_PRESS,
    )
    Toast.makeText(this, R.string.share_saved, Toast.LENGTH_SHORT).show()
    finish()
  }
}
