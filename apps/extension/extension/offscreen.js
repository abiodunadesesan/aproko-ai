let mediaRecorder = null;
let mediaStream = null;
const chunks = [];

function stopTracks() {
  mediaStream?.getTracks().forEach((track) => track.stop());
  mediaStream = null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'APROKO_OFFSCREEN_START_TAB_AUDIO') {
    void (async () => {
      try {
        stopTracks();
        chunks.length = 0;
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'tab',
              chromeMediaSourceId: message.streamId,
            },
          },
        });

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        mediaRecorder.start(1000);
        sendResponse({ ok: true });
      } catch (error) {
        stopTracks();
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'Tab audio capture failed',
        });
      }
    })();
    return true;
  }

  if (message?.type === 'APROKO_OFFSCREEN_STOP_TAB_AUDIO') {
    void (async () => {
      try {
        const recorder = mediaRecorder;
        if (!recorder || recorder.state === 'inactive') {
          stopTracks();
          sendResponse({ ok: false, error: 'Tab audio is not recording.' });
          return;
        }

        const blob = await new Promise((resolve, reject) => {
          recorder.onstop = () => {
            resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
          };
          recorder.onerror = () => reject(new Error('Tab audio recorder failed'));
          recorder.stop();
        });

        stopTracks();
        mediaRecorder = null;
        chunks.length = 0;

        const buffer = await blob.arrayBuffer();
        sendResponse({
          ok: true,
          mimeType: blob.type || 'audio/webm',
          bytes: Array.from(new Uint8Array(buffer)),
        });
      } catch (error) {
        stopTracks();
        mediaRecorder = null;
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to stop tab audio',
        });
      }
    })();
    return true;
  }

  return false;
});
