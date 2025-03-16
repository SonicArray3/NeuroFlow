import React, { useState, useRef, useCallback, useMemo } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type FileWithPreview = File & {
  preview: string;
  id: string;
  progress: number;
};

export interface FileUploadProps {
  /**
   * Function called when files are selected
   */
  onFilesSelected?: (files: FileWithPreview[]) => void;
  
  /**
   * Function called when a file is removed
   */
  onFileRemoved?: (fileId: string) => void;
  
  /**
   * Maximum file size in bytes
   * @default 5242880 (5MB)
   */
  maxSize?: number;
  
  /**
   * Maximum number of files allowed
   * @default 1
   */
  maxFiles?: number;
  
  /**
   * Accepted file types
   * @default [".pdf", ".docx", ".txt"]
   */
  accept?: string[];
  
  /**
   * Allow dropping files
   * @default true
   */
  allowDrop?: boolean;
  
  /**
   * CSS class name for the component
   */
  className?: string;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
  
  /**
   * Current files
   */
  value?: FileWithPreview[];
  
  /**
   * Function to set files
   */
  onChange?: (files: FileWithPreview[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  onFileRemoved,
  maxSize = 5 * 1024 * 1024, // 5MB
  maxFiles = 1,
  accept = [".pdf", ".docx", ".txt"],
  allowDrop = true,
  className,
  disabled = false,
  value,
  onChange,
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>(value || []);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update internal state when value prop changes
  React.useEffect(() => {
    if (value) {
      setFiles(value);
    }
  }, [value]);

  // Create a string of accepted file types for the file input
  const acceptedFileTypes = useMemo(() => accept.join(","), [accept]);

  // Format file size to a human-readable string
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Generate a file icon based on file type
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    return <FileText className="w-5 h-5" />;
  };

  // Validate a file
  const validateFile = (file: File): string | null => {
    if (!file) return "Invalid file";
    
    if (file.size > maxSize) {
      return `File size exceeds the maximum allowed size (${formatFileSize(maxSize)})`;
    }
    
    if (accept.length > 0) {
      const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!accept.includes(fileExtension) && !accept.includes(file.type)) {
        return `File type not supported. Accepted types: ${accept.join(", ")}`;
      }
    }
    
    return null;
  };

  // Create a preview for a file
  const createFilePreview = (file: File): FileWithPreview => {
    return {
      ...file,
      preview: URL.createObjectURL(file),
      id: `${file.name}-${Date.now()}`,
      progress: 100,
    };
  };

  // Handle file selection
  const handleFileSelection = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setError(null);
    
    // Check if adding these files would exceed the maximum
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`You can only upload a maximum of ${maxFiles} file(s)`);
      return;
    }
    
    const newFiles: FileWithPreview[] = [];
    let hasError = false;
    
    Array.from(selectedFiles).forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        hasError = true;
        return;
      }
      
      newFiles.push(createFilePreview(file));
    });
    
    if (!hasError) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      
      if (onChange) {
        onChange(updatedFiles);
      }
      
      if (onFilesSelected) {
        onFilesSelected(newFiles);
      }
    }
  };

  // Handle file removal
  const handleFileRemoval = (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove) {
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(fileToRemove.preview);
      
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      
      if (onChange) {
        onChange(updatedFiles);
      }
      
      if (onFileRemoved) {
        onFileRemoved(fileId);
      }
    }
  };

  // Handle file drop
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      
      if (disabled || !allowDrop) return;
      
      if (event.dataTransfer.files) {
        handleFileSelection(event.dataTransfer.files);
      }
    },
    [disabled, allowDrop, files]
  );

  // Handle drag events
  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled || !allowDrop) return;
      setIsDragging(true);
    },
    [disabled, allowDrop]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle button click to open file dialog
  const handleButtonClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  // Clean up object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      files.forEach(file => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, [files]);

  // Simulated progress update (in a real app, this would be replaced with actual upload progress)
  const updateFileProgress = (fileId: string, progress: number) => {
    setFiles(currentFiles =>
      currentFiles.map(file =>
        file.id === fileId ? { ...file, progress } : file
      )
    );
  };

  // For demo purposes, simulate upload progress when a file is added
  React.useEffect(() => {
    files.forEach(file => {
      if (file.progress < 100) {
        const interval = setInterval(() => {
          updateFileProgress(file.id, Math.min(file.progress + 10, 100));
        }, 300);
        
        return () => clearInterval(interval);
      }
    });
  }, [files]);

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors flex flex-col items-center justify-center gap-4",
          isDragging ? "border-primary bg-secondary/20" : "border-secondary",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          files.length >= maxFiles ? "pointer-events-none opacity-50" : ""
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleButtonClick}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload
            className={cn(
              "w-10 h-10",
              isDragging ? "text-primary" : "text-muted-foreground"
            )}
          />
          <div className="space-y-1">
            <p className="font-medium text-sm">
              {files.length >= maxFiles
                ? "Maximum files reached"
                : "Drag and drop files here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              Accepted file types: {accept.join(", ")}
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum file size: {formatFileSize(maxSize)}
            </p>
            {maxFiles > 1 && (
              <p className="text-xs text-muted-foreground">
                Maximum files: {maxFiles}
              </p>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          multiple={maxFiles > 1}
          className="hidden"
          disabled={disabled || files.length >= maxFiles}
          onChange={(e) => handleFileSelection(e.target.files)}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="text-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-4 border rounded-md p-3"
            >
              <div className="flex-shrink-0">
                {getFileIcon(file.name)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                
                <Progress 
                  value={file.progress} 
                  className="h-1 mt-2" 
                  aria-label={`Upload progress: ${file.progress}%`}
                />
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileRemoval(file.id);
                }}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};