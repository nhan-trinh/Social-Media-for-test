import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Pagination = ({ totalItems, itemsPerPage, currentPage, setCurrentPage }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const {t} = useTranslation()

    // Không hiển thị pagination nếu chỉ có 1 trang hoặc không có items
    if (totalPages <= 1) return null;

    const handlePrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePageClick = (page) => {
        setCurrentPage(page);
    };

    // Tạo array các số trang để hiển thị
    const getVisiblePages = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            // Nếu tổng số trang <= 5, hiển thị tất cả
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Logic phức tạp hơn cho nhiều trang
            const halfVisible = Math.floor(maxVisiblePages / 2);
            let startPage = Math.max(1, currentPage - halfVisible);
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            // Điều chỉnh startPage nếu endPage đã ở cuối
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            // Thêm trang đầu và dấu "..." nếu cần
            if (startPage > 1) {
                pages.push(1);
                if (startPage > 2) {
                    pages.push('...');
                }
            }
            
            // Thêm các trang ở giữa
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
            
            // Thêm dấu "..." và trang cuối nếu cần
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    pages.push('...');
                }
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="flex justify-center items-center space-x-1 mt-6">
            {/* Previous Button */}
            <button
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
                onClick={handlePrevious}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t("Previous")}
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
                {visiblePages.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className="px-3 py-2 text-gray-500 dark:text-gray-400"
                            >
                                ...
                            </span>
                        );
                    }

                    return (
                        <button
                            key={page}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                            onClick={() => handlePageClick(page)}
                        >
                            {page}
                        </button>
                    );
                })}
            </div>

            {/* Next Button */}
            <button
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
                onClick={handleNext}
                disabled={currentPage === totalPages}
            >
                {t("Next")}
                <ChevronRight className="w-4 h-4 ml-1" />
            </button>
        </div>
    );
};

export default Pagination;