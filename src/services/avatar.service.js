const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class AvatarService {
  async processAvatar(file) {
    try {
      console.log('Processing avatar:', {
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      });

      const filename = path.basename(file.path);
      const outputPath = path.join(path.dirname(file.path), `processed_${filename}`);

      console.log('Output path:', outputPath);

      // 使用更兼容的配置处理图片
      await sharp(file.path, { failOnError: false })
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 90,
          force: false
        })
        .toFile(outputPath);

      // 删除原始文件
      await fs.unlink(file.path);

      const relativePath = path.join('/uploads/avatars', `processed_${filename}`);
      console.log('Returning path:', relativePath);

      // 返回处理后的文件路径
      return relativePath;
    } catch (error) {
      console.error('Error processing avatar:', error);
      throw error;
    }
  }

  async deleteOldAvatar(avatarUrl) {
    if (!avatarUrl || avatarUrl.includes('default-avatar')) return;

    try {
      const avatarPath = path.join(__dirname, '../../', avatarUrl);
      console.log('Deleting old avatar:', avatarPath);
      await fs.unlink(avatarPath);
    } catch (error) {
      console.error('Error deleting old avatar:', error);
      // 忽略删除错误，继续处理
    }
  }
}

module.exports = new AvatarService(); 