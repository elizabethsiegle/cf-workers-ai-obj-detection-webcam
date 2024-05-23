import html from '../static/webpage.html';

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
        const bytes = [...Uint8Array.from(binaryString, c => c.charCodeAt(0))]

  
        const response = await env.AI.run(
          "@cf/facebook/detr-resnet-50",
          { image: Array.from(bytes)}
        );
  
        return new Response(JSON.stringify({ response }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      return new Response('Not found', { status: 404 });
    }
  };
  