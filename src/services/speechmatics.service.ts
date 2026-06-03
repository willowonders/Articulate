export interface SpeechmaticsFiller {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

let ws: WebSocket | null = null;
let audioContext: AudioContext | null = null;
let processorNode: ScriptProcessorNode | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;
let accumulatedFillers: SpeechmaticsFiller[] = [];
let isReady = false;

async function getTemporaryKey(): Promise<string> {
  const response = await fetch('/api/speechmatics/key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl: 3600 }),
  });

  if (!response.ok) {
    throw new Error(`Speechmatics key generation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.key_value;
}

function downsampleBuffer(buffer: Float32Array, sampleRate: number): ArrayBuffer {
  if (sampleRate === 16000) {
    const pcm = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm.buffer;
  }

  const ratio = sampleRate / 16000;
  const newLength = Math.round(buffer.length / ratio);
  const pcm = new Int16Array(newLength);
  let pos = 0;
  for (let i = 0; i < newLength; i++) {
    const idx = Math.round(i * ratio);
    const s = Math.max(-1, Math.min(1, buffer[idx]));
    pcm[pos++] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return pcm.buffer;
}

export async function startRealtimeDetection(stream: MediaStream): Promise<void> {
  accumulatedFillers = [];
  isReady = false;

  const jwt = await getTemporaryKey();
  ws = new WebSocket(`wss://us.rt.speechmatics.com/v2?jwt=${jwt}`);
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    if (!ws) return;
      ws.send(
        JSON.stringify({
          message: 'StartRecognition',
          audio_format: {
            type: 'raw',
            encoding: 'pcm_s16le',
            sample_rate: 16000,
          },
          transcription_config: {
            language: 'en',
            operating_point: 'standard',
            max_delay: 2,
            transcript_filtering_config: {
              remove_disfluencies: false,
            },
          },
          enable_partials: true,
        })
      );
  };

  ws.onmessage = (event) => {
    if (typeof event.data !== 'string') return;
    try {
      const msg = JSON.parse(event.data);

      if (msg.message === 'RecognitionStarted') {
        isReady = true;
        return;
      }

      if (msg.message === 'AddTranscript') {
        extractFillersFromMessage(msg);
      }

      if (msg.message === 'Error') {
        // Server error received
      }
    } catch {
      // ignore parse errors
    }
  };

  ws.onerror = (_err) => {
    // WebSocket error
  };

  ws.onclose = (_event) => {
    ws = null;
  };

  // Wait for RecognitionStarted before streaming audio
  audioContext = new AudioContext({ sampleRate: 16000 });
  sourceNode = audioContext.createMediaStreamSource(stream);
  processorNode = audioContext.createScriptProcessor(4096, 1, 1);

  processorNode.onaudioprocess = (event) => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !isReady) return;
    const inputData = event.inputBuffer.getChannelData(0);
    const pcmBuffer = downsampleBuffer(inputData, audioContext?.sampleRate ?? 16000);
    const uint8 = new Uint8Array(pcmBuffer);
    ws.send(uint8);
  };

  sourceNode.connect(processorNode);
  processorNode.connect(audioContext.destination);
}

export function stopRealtimeDetection(): SpeechmaticsFiller[] {
  isReady = false;

  // Disconnect audio nodes
  if (processorNode) {
    processorNode.disconnect();
    processorNode = null;
  }
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }

  const fillers = [...accumulatedFillers];
  accumulatedFillers = [];

  // Give server a moment to flush final transcripts
  if (ws) {
    ws.send(JSON.stringify({ message: 'StopRecognition' }));
    setTimeout(() => {
      ws?.close();
      ws = null;
    }, 1000);
  }

  return fillers;
}

function extractFillersFromMessage(msg: { results?: Array<{ words?: Array<{ word: string; start: number; end: number; score: number; tags?: string[] }> }> }): void {
  const results = msg.results;
  if (!results) return;

  for (const result of results) {
    const words = result.words;
    if (!words) continue;

    for (const w of words) {
      if (w.tags?.includes('disfluency')) {
        accumulatedFillers.push({
          word: w.word,
          start: w.start,
          end: w.end,
          confidence: w.score,
        });
      }
    }
  }
}
