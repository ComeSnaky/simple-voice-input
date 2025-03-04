document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startButton');
  const resultArea = document.getElementById('result');
  const languageSelect = document.getElementById('language');
  let recognition;
  let isRecording = false;

  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.lang = languageSelect.value;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      resultArea.value = finalTranscript + interimTranscript;
    };

    recognition.onerror = (event) => {
      console.error('Fehler bei der Spracherkennung:', event.error);
      startButton.textContent = '🎤 Spracheingabe starten';
      isRecording = false;
    };

    recognition.onend = () => {
      if (isRecording) recognition.start();
    };
  } else {
    resultArea.value = 'Spracherkennung wird von deinem Browser nicht unterstützt.';
    startButton.disabled = true;
  }

  languageSelect.addEventListener('change', () => {
    recognition.lang = languageSelect.value;
  });

  startButton.addEventListener('click', () => {
    if (!isRecording) {
      recognition.start();
      startButton.textContent = '🎤 Aufnahme stoppen';
      isRecording = true;
    } else {
      recognition.stop();
      startButton.textContent = '🎤 Spracheingabe starten';
      isRecording = false;

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "insertText", text: resultArea.value });
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'insertText') {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      activeElement.value += message.text;
    }
  }
});
