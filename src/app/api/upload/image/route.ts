import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get('cookie')?.split('rw_session=')[1]?.split(';')[0];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyTokenEdge(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Cloudinary not configured' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary using stream
    try {
      return await new Promise<NextResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'riwayat/menu',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              return resolve(
                NextResponse.json(
                  { error: 'Upload failed', details: String(error) },
                  { status: 400 }
                )
              );
            }

            resolve(
              NextResponse.json({
                success: true,
                upload: {
                  publicId: result?.public_id,
                  secureUrl: result?.secure_url,
                  width: result?.width,
                  height: result?.height,
                },
              })
            );
          }
        );

        stream.on('error', (error) => {
          console.error('Stream error:', error);
          return resolve(
            NextResponse.json(
              { error: 'Upload failed', details: String(error) },
              { status: 400 }
            )
          );
        });

        stream.end(buffer);
      });
    } catch (streamError) {
      console.error('Stream handling error:', streamError);
      return NextResponse.json(
        { error: 'Upload failed', details: String(streamError) },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: String(error) },
      { status: 400 }
    );
  }
}
