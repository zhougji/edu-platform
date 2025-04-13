const corsOptions = {
    origin: [
        'https://qimingyu.xyz',
        'https://www.qimingyu.xyz',
        process.env.NODE_ENV === 'development' && 'http://localhost:3000'
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}; 