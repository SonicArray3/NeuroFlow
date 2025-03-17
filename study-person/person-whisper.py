from flask import Flask, jsonify
import sounddevice as sd
import vosk
import json
import numpy as np

app = Flask(__name__)

# Load the Vosk model
model_path = "vosk-model-small-en-us-0.15"  # Update with correct model path
model = vosk.Model(model_path)
samplerate = 16000  # Adjust based on your setup

@app.route("/")
def home():
    return "Vosk Speech Recognition API is running."

@app.route("/record", methods=["GET"])
def record_audio():
    duration = 20  # Adjust recording duration
    print("Recording audio... Speak now!")

    audio_data = sd.rec(int(samplerate * duration), samplerate=samplerate, channels=1, dtype='int16')
    sd.wait()

    rec = vosk.KaldiRecognizer(model, samplerate)
    if rec.AcceptWaveform(audio_data.tobytes()):
        result = json.loads(rec.Result())
        return jsonify({"transcription": result.get("text", "")})
    else:
        return jsonify({"error": "Unable to recognize speech"}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
