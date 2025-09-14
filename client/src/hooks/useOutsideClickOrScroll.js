import { useEffect, useRef } from "react";

const useOutsideClickOrScroll = (callback) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    // const handleScroll = () => {
    //   callback();
    // };

    document.addEventListener("mousedown", handleClickOutside);
    // window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // window.removeEventListener("scroll", handleScroll, true);
    };
  }, [callback]);

  return ref;
};

export default useOutsideClickOrScroll;

