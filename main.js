const { app, BrowserWindow, ipcMain } = require('electron');
require('dotenv').config();
const path = require('path');
const { createClient } = require("@deepgram/sdk");
const { record } = require('node-record-lpcm16');

const deepgram = createClient(process.env.DEEPGRAM_API); // Replace with your API key
let mainWindow;

console.log(process.env, "9")
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

// Capture audio and start transcription based on selected device
ipcMain.on('start-transcription', (event, selectedDeviceId) => {
    const dgConnection = deepgram.listen.live({
        model: 'nova',
        punctuate: true,
        interim_results: false,
    });

    // Start recording audio
    const recordingStream = record({
        sampleRate: 16000,
        channels: 1, // Mono
        threshold: 0,
        device: selectedDeviceId, // Use the selected audio device
        parse: false // We'll send raw audio data directly
    });

    // Pipe the audio stream directly to Deepgram's connection
    recordingStream.stream().pipe(dgConnection);

    // recordingStream.on('error', (err) => {
    //     console.error('Recording error:', err);
    // });

    // Handle Deepgram transcriptions
    dgConnection.on('transcript', (data) => {

        console.log("Deepgram WebSocket opened")
        const transcription = data.channel.alternatives[0].transcript;
        if (transcription) {
            mainWindow.webContents.send('transcription-result', transcription);
        }
    });

    dgConnection.on('close', () => {
        console.log('Deepgram WebSocket closed.');
        recordingStream.stop(); // Ensure we stop the recording
    });

    dgConnection.on('error', (error) => {
        console.error('Error with Deepgram WebSocket:', error);
        mainWindow.webContents.send('transcription-error', 'Error with transcription API');
    });
});

// Listen for the 'stop-transcription' event and stop the recording
ipcMain.on('stop-transcription', () => {
    record.stop(); // Stop any ongoing recording
});
