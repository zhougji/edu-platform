import React from 'react';
import { Link } from 'react-router-dom';

const AIToolCard = ({ tool }) => {
    const { id, title, description, icon, path, color } = tool;

    return (
        <Link to={path} className="ai-tool-card" style={{ backgroundColor: color }}>
            <div className="tool-icon">
                <i className={icon}></i>
            </div>
            <div className="tool-info">
                <h3 className="tool-title">{title}</h3>
                <p className="tool-description">{description}</p>
            </div>
        </Link>
    );
};

export default AIToolCard; 