import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SearchBar from '../../components/resources/SearchBar';
import ResourceFilter from '../../components/resources/ResourceFilter';
import ResourceCard from '../../components/resources/ResourceCard';
import { getResources } from '../../services/resourceService';

const OnlineResources = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const resourcesRef = useRef(null);

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({
        page: parseInt(searchParams.get('page') || '1', 10),
        pages: 1,
        total: 0
    });

    // 获取当前筛选和搜索参数
    const getCurrentParams = () => {
        return {
            keyword: searchParams.get('keyword') || '',
            subject: searchParams.get('subject') || '',
            grade: searchParams.get('grade') || '',
            type: searchParams.get('type') || '',
            sortBy: searchParams.get('sortBy') || 'createdAt:desc',
            page: parseInt(searchParams.get('page') || '1', 10),
            limit: 12
        };
    };

    // 加载资源数据
    const loadResources = async () => {
        try {
            setLoading(true);
            const params = getCurrentParams();
            const result = await getResources(params);

            setResources(result.data);
            setPagination({
                page: result.page,
                pages: result.pages,
                total: result.total
            });
            setLoading(false);

            // 滚动到页面顶部
            if (resourcesRef.current && params.page > 1) {
                resourcesRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            setError(error.message || '加载资源失败');
            setLoading(false);
            console.error('加载资源错误:', error);
        }
    };

    // 监听URL参数变化，重新加载资源
    useEffect(() => {
        loadResources();
    }, [location.search]);

    // 处理搜索
    const handleSearch = (keyword) => {
        const params = new URLSearchParams(location.search);

        if (keyword) {
            params.set('keyword', keyword);
        } else {
            params.delete('keyword');
        }

        // 重置页码
        params.set('page', '1');

        navigate({
            pathname: location.pathname,
            search: params.toString()
        });
    };

    // 处理筛选
    const handleFilter = (filters) => {
        const params = new URLSearchParams(location.search);

        // 更新筛选参数
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        // 保留搜索关键词
        const keyword = searchParams.get('keyword');
        if (keyword) {
            params.set('keyword', keyword);
        }

        // 重置页码
        params.set('page', '1');

        navigate({
            pathname: location.pathname,
            search: params.toString()
        });
    };

    // 处理分页
    const handlePageChange = (newPage) => {
        const params = new URLSearchParams(location.search);
        params.set('page', newPage.toString());

        navigate({
            pathname: location.pathname,
            search: params.toString()
        });
    };

    // 渲染分页控件
    const renderPagination = () => {
        const { page, pages } = pagination;

        if (pages <= 1) {
            return null;
        }

        // 生成页码数组
        let pageNumbers = [];
        if (pages <= 5) {
            // 少于5页时显示所有页码
            pageNumbers = Array.from({ length: pages }, (_, i) => i + 1);
        } else {
            // 当前页附近的页码
            const startPage = Math.max(1, page - 2);
            const endPage = Math.min(pages, page + 2);

            // 添加第一页
            if (startPage > 1) {
                pageNumbers.push(1);
                if (startPage > 2) {
                    pageNumbers.push('...');
                }
            }

            // 添加中间页码
            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }

            // 添加最后一页
            if (endPage < pages) {
                if (endPage < pages - 1) {
                    pageNumbers.push('...');
                }
                pageNumbers.push(pages);
            }
        }

        return (
            <div className="pagination">
                <button
                    className="pagination-btn"
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                >
                    上一页
                </button>

                {pageNumbers.map((num, index) => (
                    num === '...' ? (
                        <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                    ) : (
                        <button
                            key={num}
                            className={`pagination-btn ${page === num ? 'active' : ''}`}
                            onClick={() => handlePageChange(num)}
                        >
                            {num}
                        </button>
                    )
                ))}

                <button
                    className="pagination-btn"
                    disabled={page === pages}
                    onClick={() => handlePageChange(page + 1)}
                >
                    下一页
                </button>
            </div>
        );
    };

    return (
        <div className="online-resources-page" ref={resourcesRef}>
            <div className="page-header">
                <h1 className="page-title">在线资源</h1>
                <p className="page-description">
                    浏览和搜索优质教育资源，支持按学科、年级和资源类型筛选
                </p>
            </div>

            <div className="search-section">
                <SearchBar onSearch={handleSearch} />
            </div>

            <div className="resources-container">
                <div className="filter-sidebar">
                    <ResourceFilter onFilter={handleFilter} />
                </div>

                <div className="resources-content">
                    {loading ? (
                        <div className="loading-resources">
                            <i className="fas fa-spinner fa-spin"></i>
                            <span>正在加载资源...</span>
                        </div>
                    ) : error ? (
                        <div className="resources-error">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{error}</span>
                            <button onClick={loadResources} className="retry-button">
                                重试
                            </button>
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="no-resources">
                            <i className="fas fa-search"></i>
                            <h3>未找到相关资源</h3>
                            <p>
                                尝试更改搜索关键词或筛选条件，或者
                                <button onClick={() => navigate('/student/resources')} className="clear-filter-button">
                                    清除所有筛选条件
                                </button>
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="resources-result-info">
                                找到 <strong>{pagination.total}</strong> 个资源
                                {searchParams.get('keyword') && (
                                    <span> 与 "<strong>{searchParams.get('keyword')}</strong>" 相关</span>
                                )}
                            </div>

                            <div className="resources-grid">
                                {resources.map((resource) => (
                                    <ResourceCard key={resource._id} resource={resource} />
                                ))}
                            </div>

                            {renderPagination()}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnlineResources; 