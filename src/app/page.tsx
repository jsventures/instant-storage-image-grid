'use client';

import { init, InstaQLEntity } from '@instantdb/react';
import schema, { AppSchema } from '../../instant.schema';
import React from 'react';

type InstantFile = InstaQLEntity<AppSchema, '$files'>

const APP_ID = 'e2992819-542a-4f6c-89d8-81967deb3a28';

const db = init({ appId: APP_ID, schema });

// `uploadFile` is what we use to do the actual upload!
// the `$files` will automatically update once the upload is complete
async function uploadImage(file: File) {
  try {
    // Optional metadata you can set for uploads
    const opts = {
      // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
      // Default: 'application/octet-stream'
      contentType: file.type,
      // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
      // Default: 'inline'
      contentDisposition: 'attachment; filename="moop.jpg"',
    };
    await db.storage.uploadFile(file.name, file, opts);
  } catch (error) {
    console.error('Error uploading image:', error);
  }
}

// `delete` is what we use to delete a file from storage
// `$files` will automatically update once the delete is complete
async function deleteImage(image: InstantFile) {
  await db.storage.delete(image.path);
}

function App() {
  // $files is the special namespace for querying storage data
  const { isLoading, error, data } = db.useQuery({
    $files: {
      $: {
        order: { serverCreatedAt: 'asc' },
      },
    },
  });

  if (isLoading) {
    return null;
  }

  if (error) {
    return <div>Error fetching data: {error.message}</div>;
  }

  // The result of a $files query will contain objects with
  // metadata and a download URL you can use for serving files!
  const { $files: images } = data
  return (
    <div className="box-border bg-gray-50 font-mono min-h-screen p-5 flex items-center flex-col">
      <div className="tracking-wider text-5xl text-gray-300 mb-8">
        Image Feed
      </div>
      <ImageUpload />
      <div className="text-xs text-center py-4">
        Upload some images and they will appear below! Open another tab and see
        the changes in real-time!
      </div>
      <ImageGrid images={images} />
    </div>
  );
}

interface SelectedFile {
  file: File;
  previewURL: string;
}

function ImageUpload() {
  const [selectedFile, setSelectedFile] = React.useState<SelectedFile | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { previewURL } = selectedFile || {};

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setSelectedFile({ file, previewURL });
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      setIsUploading(true);

      await uploadImage(selectedFile.file);

      URL.revokeObjectURL(selectedFile.previewURL);
      setSelectedFile(null);
      fileInputRef.current?.value && (fileInputRef.current.value = '');
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-8 p-5 border-2 border-dashed border-gray-300 rounded-lg">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="font-mono"
      />
      {isUploading ? (
        <div className="mt-5 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-t-2 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
          <p className="mt-2 text-sm text-gray-600">Uploading...</p>
        </div>
      ) : previewURL && (
        <div className="mt-5 flex flex-col items-center gap-3">
          <img src={previewURL} alt="Preview" className="max-w-xs max-h-xs object-contain" />
          <button onClick={handleUpload} className="py-2 px-4 bg-green-500 text-white border-none rounded cursor-pointer font-mono">
            Upload Image
          </button>
        </div>
      )}
    </div>
  );
}

function ImageGrid({ images }: { images: InstantFile[] }) {
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set());

  const handleDelete = async (image: InstantFile) => {
    setDeletingIds((prev) => new Set([...prev, image.id]));

    await deleteImage(image);

    setDeletingIds((prev) => {
      prev.delete(image.id);
      return prev;
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 w-full max-w-6xl">
      {images.map((image) => {
        const isDeleting = deletingIds.has(image.id);
        return (
          <div key={image.id} className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="relative">
              {/* $files entities come with a `url` property */}
              <img src={image.url} alt={image.path} className="w-full h-64 object-cover" />
              {isDeleting && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-t-2 border-gray-200 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="p-3 flex justify-between items-center bg-white">
              <span>{image.path}</span>
              <span onClick={() => handleDelete(image)} className="cursor-pointer text-gray-300 px-1">
                𝘟
              </span>
            </div>
          </div>
        )
      })}
    </div>
  );
}

export default App;
