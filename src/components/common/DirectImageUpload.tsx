import React, { useRef, useState, useEffect } from "react";
import { Upload, X, RefreshCw, Image as ImageIcon, AlertCircle, Images, Check } from "lucide-react";
import { uploadFile, listMediaFiles } from "../../lib/api";
import { MediaItem } from "../../types";

interface DirectImageUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
  helpText?: string;
  accept?: string;
  onUploadingChange?: (uploading: boolean) => void;
}

export const DirectImageUpload: React.FC<DirectImageUploadProps> = ({
  label,
  value,
  onChange,
  required = false,
  helpText = "Upload high quality JPG, PNG, or WEBP (max 25MB)",
  accept = "image/jpeg,image/png,image/webp,image/gif",
  onUploadingChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<MediaItem[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  // Sync / clear local preview when external value changes
  useEffect(() => {
    setPreviewUrl(null);
  }, [value]);

  // Cleanup object URL when previewUrl changes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const openPicker = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const openGalleryModal = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsGalleryOpen(true);
    setIsLoadingGallery(true);
    try {
      const res = await listMediaFiles();
      setGalleryItems(res.items || []);
    } catch {
      // silently handle
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleSelectFromGallery = (url: string) => {
    onChange(url);
    setIsGalleryOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediately show high-speed local preview before server upload starts
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setError(null);
    setIsUploading(true);
    onUploadingChange?.(true);

    try {
      const uploadedUrl = await uploadFile(file);
      onChange(uploadedUrl);
    } catch (err: any) {
      // Revert preview on upload failure
      setPreviewUrl(null);
      setError(err.message || "Upload failed. Please try another image.");
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onChange("");
  };

  const displayImage = previewUrl || value;
  const hasImage = Boolean(displayImage);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openGalleryModal}
            className="text-xs text-slate-600 hover:text-emerald-700 font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Choose from existing media gallery"
          >
            <Images className="w-3.5 h-3.5 text-emerald-600" /> Media Library
          </button>
          {hasImage && (
            <button
              type="button"
              onClick={openPicker}
              disabled={isUploading}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1.5 px-2 py-0.5 rounded-lg hover:bg-emerald-50 transition cursor-pointer disabled:opacity-50"
              title="Replace existing image"
            >
              <RefreshCw className={`w-3 h-3 ${isUploading ? "animate-spin" : ""}`} /> Replace
            </button>
          )}
        </div>
      </div>

      {/* Off-screen accessible file input: reliable click handler across all browsers */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          border: 0,
          opacity: 0,
          pointerEvents: "none"
        }}
        tabIndex={-1}
        aria-hidden="true"
      />

      {hasImage ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video max-h-56 flex items-center justify-center shadow-xs">
          <img
            src={displayImage}
            alt={label}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80";
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={openPicker}
              disabled={isUploading}
              className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-semibold shadow hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? "animate-spin" : ""}`} /> Replace Image
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold shadow hover:bg-red-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
              <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" /> Uploading to server...
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <div
            onClick={openPicker}
            className={`flex-1 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
              error
                ? "border-red-300 bg-red-50/50"
                : "border-slate-300 hover:border-emerald-600 bg-slate-50/50 hover:bg-emerald-50/20"
            }`}
          >
            {isUploading ? (
              <div className="py-2 flex flex-col items-center justify-center gap-2 text-emerald-700">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <p className="text-xs font-semibold">Uploading to persistent storage...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Click to browse and upload image
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{helpText}</p>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={openGalleryModal}
            className="border border-slate-200 hover:border-emerald-600 bg-white hover:bg-emerald-50/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-slate-700 hover:text-emerald-700 transition cursor-pointer sm:w-36 shrink-0"
          >
            <Images className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold">From Gallery</span>
            <span className="text-[10px] text-slate-400">Select uploaded</span>
          </button>
        </div>
      )}

      {/* Media Library Selection Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Images className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-900">Select Image from Media Library</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {isLoadingGallery ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                  <p className="text-xs">Loading media files...</p>
                </div>
              ) : galleryItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">No media files found in library.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {galleryItems.map((item) => {
                    const isSelected = value === item.url;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectFromGallery(item.url)}
                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                          isSelected
                            ? "border-emerald-600 ring-2 ring-emerald-500/30"
                            : "border-slate-200 hover:border-emerald-500"
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.originalName || item.filename}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 truncate text-[9px] text-white">
                          {item.originalName || item.filename}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsGalleryOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
};

// Multiple Images Upload component for Products
interface MultipleImageUploadProps {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  label,
  images = [],
  onChange,
  maxImages = 12
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<MediaItem[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = (e.target.files ? Array.from(e.target.files) : []) as File[];
    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setError(`You can upload at most ${maxImages} images per product.`);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const url = await uploadFile(file);
        newUrls.push(url);
      }
      onChange([...images, ...newUrls]);
    } catch (err: any) {
      setError(err.message || "Failed to upload one or more images.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const openGalleryModal = async () => {
    setIsGalleryOpen(true);
    setIsLoadingGallery(true);
    try {
      const res = await listMediaFiles();
      setGalleryItems(res.items || []);
    } catch {
      // silently handle
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const toggleGalleryItem = (url: string) => {
    if (images.includes(url)) {
      onChange(images.filter((img) => img !== url));
    } else {
      if (images.length >= maxImages) {
        setError(`You can select at most ${maxImages} images.`);
        return;
      }
      onChange([...images, url]);
    }
  };

  const removeImage = (index: number) => {
    const filtered = images.filter((_, i) => i !== index);
    onChange(filtered);
  };

  const setAsCover = (index: number) => {
    if (index === 0) return;
    const target = images[index];
    const remaining = images.filter((_, i) => i !== index);
    onChange([target, ...remaining]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">
          {label} ({images.length}/{maxImages})
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openGalleryModal}
            className="text-xs text-slate-600 hover:text-emerald-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 transition cursor-pointer"
          >
            <Images className="w-3.5 h-3.5 text-emerald-600" /> Choose from Gallery
          </button>
          <span className="text-xs text-slate-500 hidden sm:inline">First image is cover</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFilesChange}
        className="hidden"
      />

      {/* Grid of uploaded images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <div
            key={`${img}-${idx}`}
            className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-2xs"
          >
            <img
              src={img}
              alt={`Product image ${idx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80";
              }}
            />
            {idx === 0 && (
              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded-md shadow z-10">
                Cover
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 z-20">
              {idx !== 0 && (
                <button
                  type="button"
                  onClick={() => setAsCover(idx)}
                  className="px-2 py-1 bg-white/90 text-slate-800 rounded text-[11px] font-semibold hover:bg-white w-full text-center cursor-pointer"
                >
                  Make Cover
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="px-2 py-1 bg-red-600 text-white rounded text-[11px] font-semibold hover:bg-red-700 w-full text-center flex items-center justify-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl aspect-square flex flex-col items-center justify-center gap-1.5 bg-slate-50/50 hover:bg-emerald-50/20 text-slate-600 hover:text-emerald-700 transition cursor-pointer p-2 text-center"
          >
            {isUploading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-semibold">+ Add Photos</span>
                <span className="text-[10px] text-slate-400">Direct upload</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Gallery Selection Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Images className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-900">Select Photos from Media Library</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {isLoadingGallery ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                  <p className="text-xs">Loading media files...</p>
                </div>
              ) : galleryItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">No media files found in library.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {galleryItems.map((item) => {
                    const isSelected = images.includes(item.url);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleGalleryItem(item.url)}
                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                          isSelected
                            ? "border-emerald-600 ring-2 ring-emerald-500/30"
                            : "border-slate-200 hover:border-emerald-500"
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.originalName || item.filename}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 truncate text-[9px] text-white">
                          {item.originalName || item.filename}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                Selected {images.length} of {maxImages} maximum
              </span>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(false)}
                className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
};
