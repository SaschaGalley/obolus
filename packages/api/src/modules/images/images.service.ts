import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from '../../database/entities';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class ImagesService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(Image)
    private readonly imageRepo: Repository<Image>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async resizeFile(filepath: string): Promise<void> {
    const buffer = await sharp(filepath)
      .resize(200, 200, { fit: 'cover' })
      .toBuffer();
    fs.writeFileSync(filepath, buffer);
  }

  async findAll(userId: number) {
    return this.imageRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async upload(userId: number, file: Express.Multer.File) {
    await this.resizeFile(file.path);
    const image = this.imageRepo.create({
      userId,
      filename: file.filename,
    });
    return this.imageRepo.save(image);
  }

  async remove(userId: number, id: number) {
    const image = await this.imageRepo.findOne({
      where: { id, userId },
    });
    if (!image) throw new NotFoundException('Image not found');

    // Remove file from disk
    const filePath = path.join(this.uploadDir, image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.imageRepo.remove(image);
  }
}
