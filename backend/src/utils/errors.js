class ErrorApp extends Error {
  constructor(mensaje, estado = 400) {
    super(mensaje);
    this.name = 'ErrorApp';
    this.estado = estado;
  }
}

const responderError = (res, error) => {
  if (error instanceof ErrorApp) {
    return res.status(error.estado).json({ success: false, message: error.message });
  }

  console.error('[ERROR]', error);

  if (error?.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Ese dato ya está registrado' });
  }

  const esErrorDeConexion =
    ['P1000', 'P1001', 'P1002', 'P1017', '28P01', 'ECONNREFUSED'].includes(error?.code) ||
    /ECONNREFUSED|ENOTFOUND|password authentication failed|Authentication failed|Can't reach database server/i.test(
      error?.message || ''
    );

  if (esErrorDeConexion) {
    return res.status(503).json({
      success: false,
      message: 'No se pudo conectar con la base de datos. Intenta de nuevo en un momento.',
    });
  }

  return res.status(500).json({ success: false, message: 'Ocurrió un error en el servidor. Intenta de nuevo.' });
};

module.exports = { ErrorApp, responderError };