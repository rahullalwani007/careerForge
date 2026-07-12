// Wraps an async route handler so a thrown/rejected error is passed
// to Express's error handler instead of crashing the process.
function ah(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

function errorHandler(err, req, res, _next) {
  console.error('[API error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}

module.exports = { ah, errorHandler };
