import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

// Define the interface locally to avoid global namespace issues
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    file: MulterFile,
  ): Promise<{ public_id: string; secure_url: string; url: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'puente-productos',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result as { public_id: string; secure_url: string; url: string });
          },
        )
        .end(file.buffer);
    });
  }

  /**
   * Upload a Base64 image (signature or photo) to the POD folder.
   * @param base64Data - The Base64 encoded image (data:image/png;base64,...)
   * @param resourceType - Optional resource type (default: 'image')
   * @returns Cloudinary upload result with public_id and secure_url
   */
  async uploadBase64(
    base64Data: string,
    folder: string = 'puente-pod',
  ): Promise<{ public_id: string; secure_url: string; url: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Data,
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as { public_id: string; secure_url: string; url: string });
        },
      );
    });
  }

  /**
   * Upload a file buffer (photo from camera) to the POD folder.
   * @param file - The uploaded file
   * @returns Cloudinary upload result
   */
  async uploadPODImage(
    file: MulterFile,
  ): Promise<{ public_id: string; secure_url: string; url: string }> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'puente-pod',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result as { public_id: string; secure_url: string; url: string });
          },
        )
        .end(file.buffer);
    });
  }
}
