import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSubjects } from '../../services/resourceService';

const TeacherFilter = ({ onFilter }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState({
        subject: searchParams.get('subject') || ''
    });

    // 加载学科列表
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                setLoading(true);
                const subjectsData = await getSubjects();
                setSubjects(subjectsData);
                setLoading(false);
            } catch (error) {
                setError('加载学科列表失败');
                setLoading(false);
                console.error('加载学科列表错误:', error);
            }
        };

        fetchSubjects();
    }, []);

    // 处理筛选变化
    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        setFilters({
            ...filters,
            [name]: value
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
        };

        setFilters(resetFilters);

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
        <div className="teacher-filter">
            <div className="filter-header">
                <h3>筛选教师</h3>
                <button type="button" className="reset-button" onClick={handleReset}>
                    重置
                </button>
            </div>

            <div className="filter-group">
                <label>教授学科</label>
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
        </div>
    );
};

export default TeacherFilter; 