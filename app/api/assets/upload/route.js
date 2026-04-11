export async function POST(req) {
  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), { status: 400 });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ImgBB API Key is missing. Please add it to your .env.local" }), { status: 500 });
    }

    // Prepare Base64 (remove data:image/xxx;base64, prefix)
    const base64Image = image.split(',')[1];

    // Upload to ImgBB
    const formData = new URLSearchParams();
    formData.append('image', base64Image);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return new Response(JSON.stringify({ url: data.data.url }), { status: 200 });
    } else {
      throw new Error(data.error?.message || "ImgBB Upload failed");
    }
  } catch (error) {
    console.error("ImgBB Upload API Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
