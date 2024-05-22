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

      return new Response(JSON.stringify({ inputs: { image: [] }, response }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};