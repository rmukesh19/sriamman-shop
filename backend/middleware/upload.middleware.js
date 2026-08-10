import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "data/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export function handleBase64Upload(req, res, next) {
  if (req.body && req.body.imageData) {
    try {
      const { imageData } = req.body;
      const matches = imageData.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
        const base64Content = matches[2];
        const buffer = Buffer.from(base64Content, "base64");
        const filename = `product_${Date.now()}.${ext}`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, buffer);
        req.uploadedFileUrl = `/uploads/${filename}`;
      }
    } catch (err) {
      console.error("Image process error:", err);
    }
  }
  next();
}
