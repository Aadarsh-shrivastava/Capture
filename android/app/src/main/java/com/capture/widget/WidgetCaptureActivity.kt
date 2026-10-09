package com.capture.widget

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity
import com.capture.MainActivity
import com.capture.R

class WidgetCaptureActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.widget_capture_activity)

    val input = findViewById<EditText>(R.id.widget_capture_input)
    val submit = findViewById<Button>(R.id.widget_capture_submit)

    submit.setOnClickListener {
      val text = input.text?.toString()?.trim() ?: ""
      if (text.isEmpty()) {
        input.error = " "
        return@setOnClickListener
      }

      WidgetCaptureStorage.save(this, text)

      val launch = Intent(this, MainActivity::class.java).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        putExtra(MainActivity.EXTRA_WIDGET_CAPTURE, true)
      }
      startActivity(launch)
      finish()
    }
  }
}
