document.addEventListener('DOMContentLoaded', () => {
    let recorder;
    let recordedChunks = [];

    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const detectButton = document.getElementById('detectButton');
    const listenButton = document.getElementById('listenButton');
    const downloadRecordingButton = document.getElementById('downloadRecordingButton');
    const downloadEmotionButton = document.getElementById('downloadEmotionButton'); // Correct ID

    startButton.addEventListener('click', async () => {
        recordedChunks = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recorder = new MediaRecorder(stream);
            recorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            recorder.start();
            startButton.disabled = true;
            stopButton.disabled = false;
            detectButton.disabled = true;
        } catch (err) {
            console.error('Error starting recording:', err);
        }
    });

    stopButton.addEventListener('click', async () => {
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
            stopButton.disabled = true;
            detectButton.style.display = 'block'; // Display detect button
            detectButton.disabled = false; // Enable the detect button
            downloadRecordingButton.style.display = 'block'; // Display download button
            listenButton.style.display = 'block'; // Display listen button
        }
    });
    

    listenButton.addEventListener('click', () => {
        const audio = document.getElementById('recordedAudio');
        audio.play();
    });

    downloadRecordingButton.addEventListener('click', () => {
        const blob = new Blob(recordedChunks, { type: 'audio/ogg; codecs=opus' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'recorded_audio.ogg';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    });

    detectButton.addEventListener('click', async () => {
        console.log('Button clicked');
        if (recordedChunks.length === 0) {
            console.log('No recorded audio available.');
            return;
        }
    
        const blob = new Blob(recordedChunks, { type: 'audio/wav' });
        console.log('Blob created:', blob);
        const formData = new FormData();
        formData.append('audio', blob);
        console.log('FormData created:', formData);
        try {
            const response = await fetch('/predict_emotion', {
                method: 'POST',
                body: formData
            });
            console.log('Fetch response:', response);
            if (response.ok) {
                const result = await response.json();
                document.getElementById('result').innerText = `Predicted Emotion: ${result.emotion}`;
                document.getElementById('result').style.display = 'block';
                downloadEmotionButton.style.display = 'block';
                // Remove the line below since there's no 'message' key in the response
                // console.log('Server message:', result.message);
            } else {
                console.error('Error predicting emotion:', response.statusText);
            }
        } catch (error) {
            console.error('Error predicting emotion:', error);
        }
    });

});
