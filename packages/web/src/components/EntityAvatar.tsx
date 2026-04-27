import { useRef } from 'react';
import { Avatar, Spin } from 'antd';
import { CameraOutlined } from '@ant-design/icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8551';

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function pictureUrl(filename?: string) {
  if (!filename) return undefined;
  if (filename.startsWith('http')) return filename;
  return `${API_URL}/uploads/${filename}`;
}

interface EntityAvatarProps {
  name: string;
  picture?: string;
  fallbackPicture?: string;
  size?: number | 'small' | 'default' | 'large';
  onUpload?: (file: File) => void;
  uploading?: boolean;
}

export default function EntityAvatar({
  name,
  picture,
  fallbackPicture,
  size = 'default',
  onUpload,
  uploading,
}: EntityAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const src = pictureUrl(picture) || pictureUrl(fallbackPicture);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
      e.target.value = '';
    }
  };

  const avatar = (
    <Avatar
      src={src}
      size={size}
      style={{ backgroundColor: src ? undefined : '#1677ff', flexShrink: 0 }}
    >
      {!src && getInitials(name)}
    </Avatar>
  );

  if (!onUpload) return avatar;

  if (uploading) {
    return (
      <Avatar size={size} style={{ backgroundColor: '#f0f0f0' }}>
        <Spin size="small" />
      </Avatar>
    );
  }

  return (
    <>
      <div className="avatar-upload-wrapper" onClick={() => inputRef.current?.click()}>
        {avatar}
        <div className="avatar-upload-overlay">
          <CameraOutlined />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </>
  );
}
