import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SearchBar = ({ onSearch }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');

    const handleSubmit = (e) => {
        e.preventDefault();

        // 调用父组件的搜索函数
        if (onSearch) {
            onSearch(keyword);
        }

        // 更新URL参数
        searchParams.set('keyword', keyword);
        navigate({
            pathname: location.pathname,
            search: searchParams.toString()
        });
    };

    return (
        <div className="search-bar">
            <form onSubmit={handleSubmit}>
                <div className="search-input-container">
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="搜索教育资源..."
                        className="search-input"
                    />
                    <button type="submit" className="search-button">
                        <i className="fas fa-search"></i>
                        搜索
                    </button>
                </div>
                <div className="search-tips">
                    <span>热门搜索：</span>
                    <button
                        type="button"
                        className="search-tip-tag"
                        onClick={() => {
                            setKeyword('数学');
                            onSearch && onSearch('数学');
                        }}
                    >
                        数学
                    </button>
                    <button
                        type="button"
                        className="search-tip-tag"
                        onClick={() => {
                            setKeyword('语文');
                            onSearch && onSearch('语文');
                        }}
                    >
                        语文
                    </button>
                    <button
                        type="button"
                        className="search-tip-tag"
                        onClick={() => {
                            setKeyword('英语');
                            onSearch && onSearch('英语');
                        }}
                    >
                        英语
                    </button>
                    <button
                        type="button"
                        className="search-tip-tag"
                        onClick={() => {
                            setKeyword('物理');
                            onSearch && onSearch('物理');
                        }}
                    >
                        物理
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SearchBar; 