import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';

export const uploadStorage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    cb(null, `${uuid()}${extname(file.originalname)}`);
  },
});
