const { app, BrowserWindow, ipcMain } = require('electron');
require('dotenv').config();
const path = require('path');
const { createClient } = require("@deepgram/sdk");
const audioCapture = require('./native/build/Release/audioCapture.node');

const deepgram = createClient(process.env.DEEPGRAM_API); // Replace with your API key
let mainWindow;

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

// Capture audio and start transcription
ipcMain.on('start-transcription', async (event, device) => {
    console.log("Starting audio capture for transcription...");
    
    // Start audio capture
    const audioStream = audioCapture.startCapture(device);

    // Check if capture started successfully
    if (!audioStream) {
        console.error("Failed to start audio capture.");
        return;
    }

    // Open a live transcription stream to Deepgram
    const transcriptionStream = deepgram.transcription.live({
        punctuate: true,
        interim_results: false,
        language: 'en-US',
    });

    // Log each transcription update received from Deepgram
    transcriptionStream.on('transcriptReceived', (transcription) => {
        const transcriptText = transcription.channel.alternatives[0].transcript;
        if (transcriptText) {
            console.log("Transcript:", transcriptText);
            event.reply('transcription', transcriptText);  // Send back to the renderer
        }
    });

    // Handle audio data streaming to Deepgram
    audioStream.on('data', (chunk) => {
        transcriptionStream.write(chunk);
    });

    // Close transcription stream when audio capture stops
    audioStream.on('end', () => {
        console.log("Audio capture ended.");
        transcriptionStream.finish();
    });

    // Handle any errors
    audioStream.on('error', (err) => {
        console.error("Audio capture error:", err);
        transcriptionStream.finish();
    });
});
