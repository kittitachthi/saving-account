import { useState } from "react";
import styles from "./ProfileAvatar.module.css";

type Props = {
  displayName: string;
  avatarUrl: string | null;
};

export function ProfileAvatar({ displayName, avatarUrl }: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initial = displayName.trim().charAt(0).toLocaleUpperCase() || "?";
  const showImage = avatarUrl !== null && avatarUrl !== failedUrl;

  return (
    <span className={styles.avatar} aria-hidden="true">
      {showImage ? (
        <img src={avatarUrl} alt="" onError={() => setFailedUrl(avatarUrl)} />
      ) : (
        initial
      )}
    </span>
  );
}
