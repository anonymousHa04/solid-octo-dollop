const { ipcRenderer } = require('electron');

window.onload = async () => {
    const deviceSelector = document.getElementById('device-selector');
    const startButton = document.getElementById('start-button');

    // Get available media devices (microphones, speakers)
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        // Filter and get input devices (microphones)
        const inputDevices = devices.filter(device => device.kind === 'audioinput');

        // Populate the device selector dropdown with available input devices
        inputDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Device ${device.deviceId}`;
            deviceSelector.appendChild(option);
        });
    } catch (error) {
        console.error('Error listing devices:', error);
    }

    // Start transcription when the button is clicked
    startButton.addEventListener('click', () => {
        const selectedDevice = deviceSelector.value;
        ipcRenderer.send('start-transcription', selectedDevice);
    });

    // Display transcription result
    ipcRenderer.on('transcription-result', (event, transcription) => {
        document.getElementById('transcription-output').textContent = transcription;
    });

    ipcRenderer.on('transcription-error', (event, error) => {
        document.getElementById('transcription-output').textContent = error;
    });
};
