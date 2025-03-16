document.addEventListener('DOMContentLoaded', () => {
    const outputDiv = document.getElementById('output');
    const ws = new WebSocket('ws://localhost:8080');
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
        console.log('Connected to the WebSocket server');
    };

    ws.onmessage = (event) => {
        const uint8Array = new Uint8Array(event.data);
        const numbers = Array.from(uint8Array);
        outputDiv.textContent = `Received data: ${numbers}`;
        console.log('Received data:', numbers);
    };

    ws.onclose = () => {
        console.log('Disconnected from the WebSocket server');
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
});