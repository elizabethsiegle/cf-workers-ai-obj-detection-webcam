const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webcam Object Detection</title>
    <style>
        #pageTitle {
            position: -webkit-sticky; /* For Safari */
            position: sticky;
            top: 0;
            background-color: white; /* Add a background color if needed */
            padding: 10px;
            margin: 10px;
            z-index: 1000; /* Ensure it's above other content */
        }
        #resultsDiv {
            max-width: 100%;
            height: auto;
        }
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            font-family: "Comic Sans MS", cursive, sans-serif;
        }
        video, canvas, img {
            max-width: 100%;
            height: auto;
        }
        button {
            margin-top: 10px;
        }
    </style>
</head>
<body>
<h1 id="pageTitle">Webcam Object Detection</h1>
    <video id="webcam" autoplay playsinline width="640" height="480"></video>
    <button id="captureButton">Capture Frame</button>
    <canvas id="canvas" width="640" height="480" style="display: none;"></canvas>
    <img id="capturedImage" style="display: none;"/>
    <div id="results"></div>

    <script>
        const video = document.getElementById('webcam');
        const captureButton = document.getElementById('captureButton');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        const resultsDiv = document.getElementById('results');
        const capturedImage = document.getElementById('capturedImage');
        function getUniqueLabels(data) {
            // Create an object to store unique labels
            var uniqueLabels = {};
        
            // Iterate through the response array
            data.response.forEach(function(item) {
                // Extract the label from each item
                var label = item.label;
                // Check if the label exists in the uniqueLabels object
                if (!uniqueLabels[label]) {
                    // If not, add it to the object
                    uniqueLabels[label] = item;
                }
            });
        
            // Convert the uniqueLabels object back to an array
            var uniqueItems = Object.keys(uniqueLabels).map(function(label) {
                return uniqueLabels[label];
            });
            const highScoreItems = uniqueItems.filter(item => item.score > 0.8);
        
            // Return the array of highScoreItems
            return highScoreItems;
        }

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
            const uniqueItems = getUniqueLabels(result);
            displayResults(uniqueItems);
            displayCapturedImage(dataUrl, uniqueItems);
        });

        // Display the results from the object detection
        function displayResults(res) {
            resultsDiv.innerHTML = JSON.stringify(res, null, 2);
        }

        // Display the captured image with boxes drawn around the detected objects
        function displayCapturedImage(dataUrl, detections) {
            capturedImage.src = dataUrl;
            capturedImage.style.display = 'block';

            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                const imgCanvas = document.createElement('canvas');
                const imgContext = imgCanvas.getContext('2d');
                imgCanvas.width = img.width;
                imgCanvas.height = img.height;
                imgContext.drawImage(img, 0, 0);

                detections.slice(0, detections.length).forEach(detection => {
                    const { xmin, xmax, ymin, ymax } = detection.box;
                    const width = xmax - xmin;
                    const height = ymax - ymin;

                    imgContext.strokeStyle = 'red';
                    imgContext.lineWidth = 2;
                    imgContext.strokeRect(xmin, ymin, width, height);
                    imgContext.font = '18px Arial';
                    imgContext.fillStyle = 'red';
                    imgContext.fillText(detection.label, xmin, ymin > 10 ? ymin - 5 : 10);
                });
                capturedImage.src = imgCanvas.toDataURL('image/jpeg');
            };
        }

        // Initialize the webcam setup
        setupWebcam();
    </script>
    <div class="footer">
            <p>Built w/ 🧡 on <a href="https://workers.cloudflare.com/" target="_blank">Cloudflare Workers</a>, <a href="https://developers.cloudflare.com/workers-ai/models/" target="_blank">Cloudflare AI models</a>, <a href="https://ai.cloudflare.com" target="_blank">Workers AI</a>, in SF🌁 ➡️ <a href="https://github.com/elizabethsiegle/nbafinals-cloudflare-ai-hono-durable-objects" target="_blank">code</a></p>
        </div>
</body>
</html>
`;

export default {
    async fetch(request, env) {
      const url = new URL(request.url);
  
      if (request.method === 'GET' && url.pathname === '/') {
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' },
        });
      } else if (request.method === 'POST' && url.pathname === '/process') {
        const { image } = await request.json();
  
        // Decode base64 image data
        const base64Data = image.replace(/^data:image\/jpeg;base64,/, '');
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
  
        const inputs = {
          image: Array.from(bytes),
        };
  
        const response = await env.AI.run(
          "@cf/facebook/detr-resnet-50",
          inputs
        );
  
        return new Response(JSON.stringify({ response }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      return new Response('Not found', { status: 404 });
    },
  };
  