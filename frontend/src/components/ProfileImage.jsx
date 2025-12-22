import { useState } from "react";

const ProfileImage = ({
  src,
  alt = "Profile",
  size = "h-8 w-8",
  fallbackText,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = (e) => {
    println("Image load error:", e);
    setImageError(true);
  };

  // Determine text size based on image size
  const getTextSize = () => {
    if (size.includes("h-20")) return "text-3xl";
    if (size.includes("h-16")) return "text-2xl";
    if (size.includes("h-12")) return "text-xl";
    if (size.includes("h-10")) return "text-lg";
    return "text-sm";
  };

  return (
    <div
      className={`${size} rounded-full bg-blue-100 flex items-center justify-center ${className}`}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          className={`${size} rounded-full object-cover`}
          onError={handleImageError}
        />
      ) : (
        <span className={`${getTextSize()} font-medium text-blue-600`}>
          {fallbackText || "U"}
        </span>
      )}
    </div>
  );
};

export default ProfileImage;
