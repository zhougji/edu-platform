import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTeachers } from '../../services/consultationService';
import TeacherCard from '../../components/consultation/TeacherCard';
import TeacherFilter from '../../components/consultation/TeacherFilter';

const OnlineConsultation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({
        page: parseInt(searchParams.get('page') || '1', 10),
        pages: 1,
        total: 0
    });

    // 获取当前筛选参数
    const getCurrentParams = () => {
        return {
            subject: searchParams.get('subject') || '',
            page: parseInt(searchParams.get('page') || '1', 10),
            limit: 12
        };
    };

    // 加载教师数据
    const loadTeachers = async () => {
        try {
            setLoading(true);
            const params = getCurrentParams();
            const result = await getTeachers(params);

            setTeachers(result.data);
            setPagination({
                page: result.page,
                pages: result.pages,
                total: result.total
            });
            setLoading(false);
        } catch (error) {
            setError('加载教师列表失败');
            setLoading(false);
            console.error('加载教师列表错误:', error);
        }
    };

    // 初始加载和参数变化时重新加载
    useEffect(() => {
        loadTeachers();
    }, [location.search]);

    // 处理筛选变化
    const handleFilter = (filters) => {
        const params = new URLSearchParams();

        if (filters.subject) {
            params.set('subject', filters.subject);
        }

        // 重置页码
        params.set('page', '1');

        navigate({
            pathname: location.pathname,
            search: params.toString()
        });
    };

    // 渲染分页控件
    const renderPagination = () => {
        if (pagination.pages <= 1) return null;

        return (
            <div className="pagination">
                <button
                    disabled={pagination.page === 1}
                    onClick={() => {
                        const params = new URLSearchParams(location.search);
                        params.set('page', (pagination.page - 1).toString());
                        navigate({
                            pathname: location.pathname,
                            search: params.toString()
                        });
                    }}
                    className="pagination-prev"
                >
                    上一页
                </button>

                <span className="pagination-info">
                    {pagination.page} / {pagination.pages}
                </span>

                <button
                    disabled={pagination.page === pagination.pages}
                    onClick={() => {
                        const params = new URLSearchParams(location.search);
                        params.set('page', (pagination.page + 1).toString());
                        navigate({
                            pathname: location.pathname,
                            search: params.toString()
                        });
                    }}
                    className="pagination-next"
                >
                    下一页
                </button>
            </div>
        );
    };

    return (
        <div className="online-consultation-page">
            <div className="page-header">
                <h1>在线咨询</h1>
                <p>寻找适合你的教师，获取一对一学习指导</p>
            </div>

            <div className="consultation-container">
                <aside className="filter-sidebar">
                    <TeacherFilter onFilter={handleFilter} />
                </aside>

                <div className="teachers-content">
                    {loading ? (
                        <div className="teachers-loading">
                            <i className="fas fa-spinner fa-spin"></i>
                            <span>正在加载教师列表...</span>
                        </div>
                    ) : error ? (
                        <div className="teachers-error">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{error}</span>
                            <button onClick={loadTeachers} className="retry-button">
                                重试
                            </button>
                        </div>
                    ) : teachers.length === 0 ? (
                        <div className="no-teachers">
                            <i className="fas fa-user-slash"></i>
                            <h3>未找到相关教师</h3>
                            <p>
                                尝试更改筛选条件，或者
                                <button onClick={() => navigate('/student/consultation')} className="clear-filter-button">
                                    查看所有教师
                                </button>
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="teachers-result-info">
                                找到 <strong>{pagination.total}</strong> 位教师
                                {searchParams.get('subject') && (
                                    <span> 教授 "<strong>{searchParams.get('subject')}</strong>"</span>
                                )}
                            </div>

                            <div className="teachers-grid">
                                {teachers.map((teacher) => (
                                    <TeacherCard key={teacher._id} teacher={teacher} />
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

export default OnlineConsultation; 