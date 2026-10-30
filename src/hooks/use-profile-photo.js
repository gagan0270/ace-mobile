import { useEffect, useState } from "react";

const KEY = "ace.profilePhoto";
const EVT = "ace:profile-photo-change";

export function useProfilePhoto() {
  const [photo, setPhotoState] = useState(null);

  useEffect(() => {
    try {
      setPhotoState(localStorage.getItem(KEY));
    } catch {
      /* no-op */
    }
    const onChange = (e) => {
      setPhotoState(e.detail ?? null);
    };
    window.addEventListener(EVT, onChange);
    return () => window.removeEventListener(EVT, onChange);
  }, []);

  const setPhoto = (dataUrl) => {
    try {
      if (dataUrl) localStorage.setItem(KEY, dataUrl);
      else localStorage.removeItem(KEY);
    } catch {
      /* no-op */
    }
    window.dispatchEvent(new CustomEvent(EVT, { detail: dataUrl }));
  };

  return { photo, setPhoto };
}
