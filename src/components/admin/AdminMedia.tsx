import React, { useState, useEffect, useRef } from "react";
import { uploadMediaItem, listMediaFiles, deleteMediaFile } from "../../lib/api";
import { MediaItem } from "../../types";
import {
  UploadCloud,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  HardDrive,
  FileCheck,
  X,
  Save,
  CheckCircle2
} from "lucide-react";

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeLabel(filename: string, mimeType?: string): string {
  const lower = filename.toLowerCase();
  if (mimeType?.includes("jpeg") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "JPEG";
  if (mimeType?.includes("png") || lower.endsWith(".png")) return "PNG";
  if (mimeType?.includes("webp") || lower.endsWith(".webp")) return "WEBP";
  if (mimeType?.includes("mp4") || lower.endsWith(".mp4")) return "MP4";
  if (mimeType?.includes("webm") || lower.endsWith(".webm")) return "WEBM";
  if (mimeType?.includes("gif") || lower.endsWith(".gif")) return "GIF";
  return "MEDIA";
}

export const AdminMedia: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Staged file ready to save
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deletion confirmation state
  const [fileToDelete, setFileToDelete] = useState<{ url: string; filename: string; originalName?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogError, setDeleteDialogError] = useState<string | null>(null);

  const fetchMedia = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await listMediaFiles();
      setMediaItems(res.items || []);
    } catch (err: any) {
      setActionError(err.message || "Failed to load media files from server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  // Revoke object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (stagedPreviewUrl) {
        URL.revokeObjectURL(stagedPreviewUrl);
      }
    };
  }, [stagedPreviewUrl]);

  const validateAndStageFile = (file: File) => {
    setUploadError(null);
    setActionError(null);
    setSuccessNotice(null);

    // Validate supported formats: JPEG, PNG, WEBP, MP4 (and GIF, WEBM)
    const lowerName = file.name.toLowerCase();
    const isImage =
      file.type.startsWith("image/") ||
      [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) => lowerName.endsWith(ext));
    const isVideo =
      file.type.startsWith("video/") ||
      [".mp4", ".webm"].some((ext) => lowerName.endsWith(ext));

    if (!isImage && !isVideo) {
      setUploadError("Unsupported format. Please select a JPEG, PNG, WEBP, or MP4 file.");
      return;
    }

    // Validate size limits: Images up to 10MB, Videos up to 50MB
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed is ${
          isVideo ? "50MB for videos" : "10MB for photos"
        }.`
      );
      return;
    }

    // Generate local preview
    if (stagedPreviewUrl) {
      URL.revokeObjectURL(stagedPreviewUrl);
    }
    const preview = URL.createObjectURL(file);
    setStagedPreviewUrl(preview);
    setStagedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndStageFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndStageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCancelStagedFile = () => {
    if (stagedPreviewUrl) {
      URL.revokeObjectURL(stagedPreviewUrl);
    }
    setStagedFile(null);
    setStagedPreviewUrl(null);
    setUploadError(null);
  };

  // Real Save Operation
  const handleSaveStagedFile = async () => {
    if (!stagedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setActionError(null);
    setSuccessNotice(null);

    try {
      // Actually upload and persist to server and db.media
      const savedItem = await uploadMediaItem(stagedFile);

      // Immediately show uploaded file in the UI under "Uploaded Server Files"
      setMediaItems((prev) => [
        savedItem,
        ...prev.filter((item) => item.filename !== savedItem.filename && item.url !== savedItem.url)
      ]);

      setSuccessNotice(`"${savedItem.originalName || savedItem.filename}" saved successfully to server storage!`);
      setTimeout(() => setSuccessNotice(null), 4500);

      // Clean up staged state
      if (stagedPreviewUrl) {
        URL.revokeObjectURL(stagedPreviewUrl);
      }
      setStagedFile(null);
      setStagedPreviewUrl(null);

      // Background re-fetch to confirm disk persistence
      await fetchMedia();
    } catch (err: any) {
      setUploadError(err.message || "Failed to save file to server storage.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = (url: string) => {
    const absoluteUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(absoluteUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleInitiateDelete = (item: MediaItem) => {
    setDeleteDialogError(null);
    setActionError(null);
    setFileToDelete({
      url: item.url,
      filename: item.filename,
      originalName: item.originalName
    });
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    setDeleteDialogError(null);

    const targetUrl = fileToDelete.url;
    const targetFilename = fileToDelete.filename;

    try {
      // 1. Delete from real server storage and db.media
      await deleteMediaFile(targetFilename);

      // 2. Immediately remove deleted file from the list in the UI
      setMediaItems((prev) =>
        prev.filter((item) => item.url !== targetUrl && item.filename !== targetFilename)
      );

      // 3. Close confirmation dialog
      setFileToDelete(null);

      setSuccessNotice(`File deleted successfully from server storage.`);
      setTimeout(() => setSuccessNotice(null), 3500);

      // 4. Refresh to ensure storage & database sync
      await fetchMedia();
    } catch (err: any) {
      const errMsg = err.message || "Failed to delete file from server storage.";
      setDeleteDialogError(errMsg);
      setActionError(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Media Manager
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Upload images and videos directly to permanent server storage (/uploads/).
          </p>
        </div>

        <button
          onClick={fetchMedia}
          disabled={isLoading}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alert Banners */}
      {uploadError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-red-600 hover:text-red-800 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-800 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Direct Dropzone Card */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-dashed border-slate-300 hover:border-emerald-500 transition-colors text-center relative shadow-xs"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          onChange={handleFileInputChange}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            {isUploading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <h3 className="font-semibold text-slate-900 text-base">
            Click to select or drag & drop media file
          </h3>
          <p className="text-slate-500 text-xs mt-1 max-w-md">
            Supported formats: JPEG, PNG, WEBP, and MP4.
          </p>

          <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Images up to 10MB
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1">
              <VideoIcon className="w-3.5 h-3.5 text-emerald-600" /> Videos up to 50MB
            </span>
          </div>
        </div>
      </div>

      {/* Staged File Card with Real Save Button */}
      {stagedFile && stagedPreviewUrl && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-3.5 w-full sm:w-auto min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-slate-900/5 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center relative">
              {stagedFile.type.startsWith("video/") || stagedFile.name.toLowerCase().endsWith(".mp4") ? (
                <video src={stagedPreviewUrl} className="w-full h-full object-cover" />
              ) : (
                <img
                  src={stagedPreviewUrl}
                  alt={stagedFile.name}
                  className="w-full h-full object-cover"
                />
              )}
              <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono leading-none">
                {getFileTypeLabel(stagedFile.name, stagedFile.type)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  Ready to Save
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {formatBytes(stagedFile.size)}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate mt-0.5 font-mono" title={stagedFile.name}>
                {stagedFile.name}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Click "Save File" to upload and store permanently on the server.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleCancelStagedFile}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={handleSaveStagedFile}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to Server...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save File</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Server Files Library */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-700" />
            Uploaded Server Files ({mediaItems.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Persistent storage in /uploads/
          </span>
        </div>

        {mediaItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mediaItems.map((item) => {
              const filename = item.filename || item.url.split("/").pop() || "";
              const displayName = item.originalName || filename;
              const isVideo =
                item.mimeType?.startsWith("video/") ||
                item.url.toLowerCase().endsWith(".mp4") ||
                item.url.toLowerCase().endsWith(".webm");
              const isCopied = copiedUrl === item.url;
              const typeLabel = getFileTypeLabel(filename, item.mimeType);

              return (
                <div
                  key={item.id || item.url}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition"
                >
                  {/* Thumbnail / Video Preview */}
                  <div className="aspect-square w-full relative bg-slate-100 flex items-center justify-center overflow-hidden">
                    {isVideo ? (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={displayName}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}

                    {/* Format Badge */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono uppercase tracking-wider backdrop-blur-xs">
                      {typeLabel}
                    </div>

                    {/* Size Badge if available */}
                    {item.size && item.size > 0 && (
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono backdrop-blur-xs">
                        {formatBytes(item.size)}
                      </div>
                    )}
                  </div>

                  {/* Card Details & Actions */}
                  <div className="p-2.5 bg-white border-t border-slate-100 flex flex-col gap-1.5">
                    <span
                      className="text-[11px] text-slate-700 truncate font-semibold font-mono block"
                      title={displayName}
                    >
                      {displayName}
                    </span>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {typeLabel} {item.size ? `• ${formatBytes(item.size)}` : ""}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.url)}
                          className="p-1.5 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer transition"
                          title="Copy file URL"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInitiateDelete(item)}
                          className="p-1.5 rounded text-slate-500 hover:text-red-700 hover:bg-red-50 cursor-pointer transition"
                          title="Delete from server"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-700">No media uploaded directly yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Select or drop a photo or video above to upload it to the server.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog Modal */}
      {fileToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => !isDeleting && setFileToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Delete File Permanently
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                  Are you sure you want to permanently delete this file?
                </p>
              </div>
            </div>

            {/* Thumbnail and Filename details */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                {fileToDelete.url.toLowerCase().endsWith(".mp4") ||
                fileToDelete.url.toLowerCase().endsWith(".webm") ? (
                  <VideoIcon className="w-6 h-6 text-slate-500" />
                ) : (
                  <img
                    src={fileToDelete.url}
                    alt={fileToDelete.originalName || fileToDelete.filename}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-mono text-slate-700 truncate font-semibold"
                  title={fileToDelete.originalName || fileToDelete.filename}
                >
                  {fileToDelete.originalName || fileToDelete.filename}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  This will delete the file from server storage and remove its record.
                </p>
              </div>
            </div>

            {deleteDialogError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteDialogError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setFileToDelete(null);
                  setDeleteDialogError(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
