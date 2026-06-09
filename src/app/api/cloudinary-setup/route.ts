import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with inline credentials
cloudinary.config({
  cloud_name: 'dtindnle9',      // ← replace this
  api_key: '918514988953189',   // ← replace this
  api_secret: '3Wf_DNlXsEvoJuArwyiGYyKSU3c' // ← replace this
});

export async function GET() {
  try {
    console.log('🚀 Starting Cloudinary setup...\n');

    // Step 1: Upload an image from Cloudinary's demo domain
    console.log('📤 Uploading sample image...');
    const uploadResult = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      { public_id: 'onboarding-sample' }
    );

    console.log('✅ Upload successful!');

    // Step 2: Get image metadata
    console.log('📊 Fetching image metadata...');
    const resourceResult = await cloudinary.api.resource(uploadResult.public_id);

    console.log('✅ Metadata retrieved!');

    // Step 3: Transform the image with f_auto and q_auto
    console.log('🎨 Generating optimized transformation...');
    
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: 'auto',  // f_auto: Automatically selects best format
      quality: 'auto'        // q_auto: Automatically adjusts quality for optimal compression
    });

    const result = {
      success: true,
      upload: {
        secureUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id
      },
      metadata: {
        width: resourceResult.width,
        height: resourceResult.height,
        format: resourceResult.format,
        sizeBytes: resourceResult.bytes
      },
      transformation: {
        transformedUrl: transformedUrl,
        explanation: 'f_auto selects optimal format (WebP, AVIF); q_auto optimizes quality'
      }
    };

    return Response.json(result);
  } catch (error) {
    console.error('❌ Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
