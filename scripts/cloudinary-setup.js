const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with inline credentials
cloudinary.config({
  cloud_name: 'dtindnle9',      // ← replace this
  api_key: '918514988953189',   // ← replace this
  api_secret: '3Wf_DNlXsEvoJuArwyiGYyKSU3c' // ← replace this
});

async function setupCloudinary() {
  try {
    console.log('🚀 Starting Cloudinary setup...\n');

    // Step 1: Upload an image from Cloudinary's demo domain
    console.log('📤 Uploading sample image...');
    const uploadResult = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      { public_id: 'onboarding-sample' }
    );

    console.log('✅ Upload successful!');
    console.log('   Secure URL:', uploadResult.secure_url);
    console.log('   Public ID:', uploadResult.public_id);
    console.log();

    // Step 2: Get image metadata
    console.log('📊 Fetching image metadata...');
    const resourceResult = await cloudinary.api.resource(uploadResult.public_id);

    console.log('✅ Metadata retrieved!');
    console.log('   Width:', resourceResult.width, 'px');
    console.log('   Height:', resourceResult.height, 'px');
    console.log('   Format:', resourceResult.format);
    console.log('   Size:', resourceResult.bytes, 'bytes');
    console.log();

    // Step 3: Transform the image with f_auto and q_auto
    console.log('🎨 Generating optimized transformation...');
    
    // f_auto: Automatically selects the best format (WebP for modern browsers, JPG for older)
    // q_auto: Automatically adjusts quality to maintain visual quality while minimizing file size
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: 'auto',  // f_auto equivalent
      quality: 'auto'        // q_auto equivalent
    });

    console.log('✅ Transformation complete!');
    console.log();
    console.log('✨ Done! Click link below to see optimized version of the image. Check the size and the format.');
    console.log();
    console.log('🔗 Transformed URL:', transformedUrl);
    console.log();
    console.log('💡 What happened:');
    console.log('   • Original image was uploaded to Cloudinary');
    console.log('   • f_auto: Automatically selects optimal format (WebP, AVIF, etc.)');
    console.log('   • q_auto: Automatically optimizes quality for best file size');
    console.log('   • Result: Smaller file size without visible quality loss');
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupCloudinary();
