// // hooks/useInfiniteScroll.js (không có dấu cách)
// import { useState, useEffect, useCallback } from 'react';

// const useInfiniteScroll = (callback, hasMore) => {
//   const [loading, setLoading] = useState(false);

//   const handleScroll = useCallback(() => {
//     console.log("Scroll detected", {
//       loading,
//       hasMore,
//       scrollTop: document.documentElement.scrollTop,
//       windowHeight: window.innerHeight,
//       documentHeight: document.documentElement.offsetHeight
//     });

//     if (loading || !hasMore) {
//       console.log("Scroll ignored:", { loading, hasMore });
//       return;
//     }

//     // Check if user scrolled near bottom (100px from bottom)
//     const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
//     const documentHeight = document.documentElement.offsetHeight;
//     const threshold = documentHeight - 100;

//     console.log("Scroll calculation:", {
//       scrollPosition,
//       documentHeight,
//       threshold,
//       shouldLoad: scrollPosition >= threshold
//     });

//     if (scrollPosition >= threshold) {
//       console.log("Triggering load more...");
//       setLoading(true);
//       callback().finally(() => {
//         console.log("Load more completed");
//         setLoading(false);
//       });
//     }
//   }, [callback, hasMore, loading]);

//   useEffect(() => {
//     console.log("Setting up scroll listener");
//     window.addEventListener('scroll', handleScroll);
//     return () => {
//       console.log("Cleaning up scroll listener");
//       window.removeEventListener('scroll', handleScroll);
//     };
//   }, [handleScroll]);

//   return loading;
// };

// export default useInfiniteScroll;