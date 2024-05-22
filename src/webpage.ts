import { html } from "hono/html";

export const Page = html`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webcam Object Detection</title>
    <style>
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        video, canvas {
            max-width: 100%;
            height: auto;
        }
        button {
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>Webcam Object Detection</h1>
    <video id="webcam" autoplay playsinline width="640" height="480"></video>
    <button id="captureButton">Capture Frame</button>
    <canvas id="canvas" width="640" height="480" style="display: none;"></canvas>
    <div id="results"></div>

    <script>
        const video = document.getElementById('webcam');
        const captureButton = document.getElementById('captureButton');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        const resultsDiv = document.getElementById('results');

        // Access the webcam
        async function setupWebcam() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;
            } catch (error) {
                console.error('Error accessing webcam: ', error);
            }
        }

        // Capture a frame and send it to the Cloudflare Worker
        captureButton.addEventListener('click', async () => {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            const response = await fetch('/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: dataUrl })
            });
            const result = await response.json();
            displayResults(result);
        });

        // Display the results from the object detection
        function displayResults(result) {
            resultsDiv.innerHTML = JSON.stringify(result, null, 2);
        }

        // Initialize the webcam setup
        setupWebcam();
    </script>
</body>
</html>
`;