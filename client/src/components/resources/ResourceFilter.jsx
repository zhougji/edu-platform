import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSubjects, getGrades, getResourceTypes } from '../../services/resourceService';

const ResourceFilter = ({ onFilter }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const [subjects, setSubjects] = useState([]);
    const [grades, setGrades] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState({
        subject: searchParams.get('subject') || '',
        grade: searchParams.get('grade') || '',
        type: searchParams.get('type') || '',
        sortBy: searchParams.get('sortBy') || 'createdAt:desc'
    });

    // 加载筛选选项
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                setLoading(true);
                const [subjectsData, gradesData, typesData] = await Promise.all([
                    getSubjects(),
                    getGrades(),
                    getResourceTypes()
                ]);

                setSubjects(subjectsData);
                setGrades(gradesData);
                setTypes(typesData);
                setLoading(false);
            } catch (error) {
                setError('加载筛选选项失败');
                setLoading(false);
                console.error('加载筛选选项错误:', error);
            }
        };

        fetchFilterOptions();
    }, []);

    // 处理筛选变化
    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        setFilters({
            ...filters,
            [name]: value
        });

        // 更新URL参数
        if (value) {
            searchParams.set(name, value);
        } else {
            searchParams.delete(name);
        }

        navigate({
            pathname: location.pathname,
            search: searchParams.toString()
        });

        // 调用父组件的筛选函数
        if (onFilter) {
            const newFilters = {
                ...filters,
                [name]: value
            };
            onFilter(newFilters);
        }
    };

    // 重置筛选
    const handleReset = () => {
        const resetFilters = {
            subject: '',
            grade: '',
            type: '',
            sortBy: 'createdAt:desc'
        };

        setFilters(resetFilters);

        // 更新URL参数
        navigate({
            pathname: location.pathname,
            search: ''
        });

        // 调用父组件的筛选函数
        if (onFilter) {
            onFilter(resetFilters);
        }
    };

    if (loading) {
        return <div className="filter-loading">加载筛选选项中...</div>;
    }

    if (error) {
        return <div className="filter-error">{error}</div>;
    }

    return (
        <div className="resource-filter">
            <div className="filter-header">
                <h3>筛选条件</h3>
                <button type="button" className="reset-button" onClick={handleReset}>
                    重置
                </button>
            </div>

            <div className="filter-group">
                <label>学科</label>
                <select
                    name="subject"
                    value={filters.subject}
                    onChange={handleFilterChange}
                >
                    <option value="">全部学科</option>
                    {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                            {subject}
                        </option>
                    ))}
                </select>
            </div>

            <div className="filter-group">
                <label>年级</label>
                <select
                    name="grade"
                    value={filters.grade}
                    onChange={handleFilterChange}
                >
                    <option value="">全部年级</option>
                    {grades.map((grade) => (
                        <option key={grade} value={grade}>
                            {grade}
                        </option>
                    ))}
                </select>
            </div>

            <div className="filter-group">
                <label>资源类型</label>
                <select
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                >
                    <option value="">全部类型</option>
                    {types.map((type) => (
                        <option key={type} value={type}>
                            {type === 'video' ? '视频' :
                                type === 'document' ? '文档' :
                                    type === 'article' ? '文章' :
                                        type === 'exercise' ? '习题' : type}
                        </option>
                    ))}
                </select>
            </div>

            <div className="filter-group">
                <label>排序方式</label>
                <select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                >
                    <option value="createdAt:desc">最新发布</option>
                    <option value="views:desc">最多浏览</option>
                    <option value="likes:desc">最多点赞</option>
                </select>
            </div>
        </div>
    );
};

export default ResourceFilter; 