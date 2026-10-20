// Controlador de ejemplo para usuarios
const getUsers = async (req, res) => {
  res.json({ message: "Obtener lista de usuarios" });
};

module.exports = { getUsers };