import { ChangeEvent, DragEvent, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, FileText, Loader2, Upload, X } from 'lucide-react';

export interface FileUploadCardProps {
  title: string;
  subtitle: string;
  accept: string;
  formatHint: string;
  maxSizeHint: string;
  uploading?: boolean;
  uploadButtonText?: string;
  selectButtonText?: string;
  showNameInput?: boolean;
  namePlaceholder?: string;
  nameLabel?: string;
  error?: string;
  onFileSelect?: (file: File) => void;
  onUpload: (file: File, name?: string) => void;
  onBack?: () => void;
}

export default function FileUploadCard({
  title,
  subtitle,
  accept,
  formatHint,
  maxSizeHint,
  uploading = false,
  uploadButtonText = '开始上传',
  selectButtonText = '选择文件',
  showNameInput = false,
  namePlaceholder = '留空则使用文件名',
  nameLabel = '名称（可选）',
  error,
  onFileSelect,
  onUpload,
  onBack,
}: FileUploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [name, setName] = useState('');

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
      onFileSelect?.(files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      onFileSelect?.(files[0]);
    }
  }, [onFileSelect]);

  const handleUpload = () => {
    if (!selectedFile) return;
    onUpload(selectedFile, name.trim() || undefined);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      className="max-w-3xl mx-auto pt-12 md:pt-20"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* 标题 */}
      <div className="text-center mb-10 md:mb-14">
        <motion.h1
          className="text-3xl md:text-5xl font-semibold text-slate-900 dark:text-white mb-4 tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {title}
        </motion.h1>
        <motion.p
          className="text-base md:text-lg text-slate-500 dark:text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {subtitle}
        </motion.p>
      </div>

      {/* 上传区域 */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div
          className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer
            ${dragOver
              ? 'border-primary-400 bg-primary-50 dark:border-primary-500 dark:bg-primary-950 scale-[1.01]'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
            }
            ${selectedFile ? 'p-10 md:p-12' : 'p-12 md:p-16'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          {/* 发光背景效果 - 仅在拖拽时显示 */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 pointer-events-none
              ${dragOver ? 'opacity-100' : 'opacity-0'}
            `}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
          </div>

          <input
            type="file"
            id="file-upload-input"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
          />

          <div className="relative text-center">
            <AnimatePresence mode="wait">
              {selectedFile ? (
                <motion.div
                  key="file-selected"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-5"
                >
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-500 text-white shadow-lg shadow-primary-500/20">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div className="mx-auto flex max-w-md items-center justify-center gap-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 px-6 py-4">
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{selectedFile.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-slate-600 text-slate-500 dark:text-slate-300 shadow-sm hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="no-file"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <motion.div
                    className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl transition-colors
                      ${dragOver
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                      }`}
                    animate={{ y: dragOver ? -6 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Upload className="w-10 h-10" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">点击或拖拽文件至此处</h3>
                    <p className="text-slate-400 dark:text-slate-500">
                      {formatHint}（{maxSizeHint}）
                    </p>
                  </div>
                  <motion.button
                    className="inline-flex items-center rounded-xl bg-primary-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition-colors hover:bg-primary-700"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById('file-upload-input')?.click();
                    }}
                  >
                    {selectButtonText}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* 名称输入框 */}
      {showNameInput && selectedFile && (
        <motion.div
          className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-lg shadow-slate-200/40 dark:shadow-none"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{nameLabel}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={namePlaceholder}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/60 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            disabled={uploading}
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 rounded-xl border border-red-200 bg-red-50/60 p-4 text-center text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 flex items-center justify-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 操作按钮 */}
      <div className="mt-8 flex gap-4 justify-center">
        {onBack && (
          <motion.button
            onClick={onBack}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            返回
          </motion.button>
        )}
        {selectedFile && (
          <motion.button
            onClick={handleUpload}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition-all hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
            whileHover={{ scale: uploading ? 1 : 1.02 }}
            whileTap={{ scale: uploading ? 1 : 0.98 }}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                处理中…
              </>
            ) : (
              uploadButtonText
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
