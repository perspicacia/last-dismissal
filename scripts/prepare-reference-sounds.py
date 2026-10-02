"""Prepare game cues from decoded, licensed Pixabay reference recordings.

On macOS, decode the downloaded MP3s first with:
  afconvert -f WAVE -d LEI16 opening-door-450444.mp3 door.wav
  afconvert -f WAVE -d LEI16 monstrous-scream-187949.mp3 scream.wav
Then run: python3 scripts/prepare-reference-sounds.py /path/to/decoded-wavs
The source files are not needed to run the game.
"""
import array
import pathlib
import sys
import wave

output = pathlib.Path(__file__).resolve().parents[1] / "assets" / "audio"
output.mkdir(parents=True, exist_ok=True)

def prepare(source, destination, offset, duration, peak_limit, fade_out):
    with wave.open(str(source), "rb") as recording:
        if recording.getsampwidth() != 2 or recording.getframerate() != 48000:
            raise ValueError("Expected 48 kHz, 16-bit PCM WAV")
        channels, rate = recording.getnchannels(), recording.getframerate()
        recording.setpos(round(offset * rate))
        data = array.array("h", recording.readframes(round(duration * rate)))
    if sys.byteorder != "little":
        data.byteswap()
    frames = len(data) // channels
    if frames != round(duration * rate):
        raise ValueError("Reference recording is shorter than the chosen segment")
    peak = max(abs(value) for value in data)
    gain = peak_limit * 32767 / peak if peak else 0
    for frame in range(frames):
        attack = min(1, frame / (.005 * rate))
        release = min(1, (frames - 1 - frame) / (fade_out * rate))
        for channel in range(channels):
            i = frame * channels + channel
            data[i] = round(data[i] * gain * attack * release)
    if sys.byteorder != "little":
        data.byteswap()
    with wave.open(str(destination), "wb") as recording:
        recording.setparams((channels, 2, rate, frames, "NONE", "not compressed"))
        recording.writeframes(data.tobytes())

if __name__ == "__main__":
    source = pathlib.Path(sys.argv[1])
    prepare(source / "door.wav", output / "door-creak.wav", 0, 1.4, .65, .08)
    prepare(source / "scream.wav", output / "rabbit-scream.wav", .38, .88, .85, .07)
