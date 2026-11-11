package com.capture.widget

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.speech.RecognizerIntent
import android.view.HapticFeedbackConstants
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.capture.R

/**
 * Say and forget, without opening the app: a small popup (home widget, lock screen tile) that types
 * or dictates a thought, stores it, and closes. The app turns stored thoughts into items on next open.
 */
class WidgetCaptureActivity : AppCompatActivity() {
  private lateinit var input: EditText

  // System speech UI: no mic permission or speech code of our own.
  private val dictate =
    registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
      val spoken = result.data
        ?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
        ?.firstOrNull()
        ?.trim()
        .orEmpty()
      if (spoken.isNotEmpty()) {
        input.setText(spoken)
        submit()
      } else if (intent.getBooleanExtra(EXTRA_VOICE, false) && input.text.isNullOrBlank()) {
        finish() // opened for voice, nothing said: just go away
      }
    }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // Over the lock screen (from the Quick Settings tile) without unlocking.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) setShowWhenLocked(true)
    setContentView(R.layout.widget_capture_activity)

    input = findViewById(R.id.widget_capture_input)
    findViewById<Button>(R.id.widget_capture_submit).setOnClickListener { submit() }
    findViewById<Button>(R.id.widget_capture_talk).setOnClickListener { startDictation() }

    // A floating dialog wraps its content and skips stateVisible: widen it and raise the keyboard ourselves.
    window.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    if (savedInstanceState == null && intent.getBooleanExtra(EXTRA_VOICE, false)) {
      startDictation()
    } else {
      window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE)
      input.requestFocus()
      input.post { WindowCompat.getInsetsController(window, input).show(WindowInsetsCompat.Type.ime()) }
    }
  }

  private fun startDictation() {
    val speech = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
      .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      .putExtra(RecognizerIntent.EXTRA_PROMPT, getString(R.string.widget_input_hint))
    try {
      dictate.launch(speech)
    } catch (e: ActivityNotFoundException) {
      Toast.makeText(this, R.string.widget_no_speech, Toast.LENGTH_SHORT).show()
    }
  }

  private fun submit() {
    val text = input.text?.toString()?.trim().orEmpty()
    if (text.isEmpty()) {
      input.error = " "
      return
    }
    WidgetCaptureStorage.save(this, text)
    input.performHapticFeedback(
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.CONFIRM
      else HapticFeedbackConstants.LONG_PRESS,
    )
    Toast.makeText(this, R.string.widget_captured, Toast.LENGTH_SHORT).show()
    finish()
  }

  companion object {
    const val EXTRA_VOICE = "voice"

    fun intent(context: Context, voice: Boolean): Intent =
      Intent(context, WidgetCaptureActivity::class.java)
        .putExtra(EXTRA_VOICE, voice)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
  }
}
