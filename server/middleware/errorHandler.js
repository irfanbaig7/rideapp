function errorHandler(err, req, res, next) {
    console.error('❌', err.message);
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid ID format.' });
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message).join(', ') });
    }
    if (err.code === 11000) return res.status(409).json({ error: 'This value is already in use.' });
    res.status(err.statusCode || 500).json({ error: err.message || 'Something went wrong.' });
}

module.exports = { errorHandler };