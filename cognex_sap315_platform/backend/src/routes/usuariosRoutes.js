const express = require('express');
const router = express.Router();
const { 
  getRoles, 
  getUsuarios, 
  crearUsuario, 
  actualizarEstadoUsuario, 
  eliminarUsuario,
  editarUsuario
} = require('../controllers/usuariosController');

const { verificarToken } = require('../middleware/authMiddleware');

router.use(verificarToken);

router.get('/roles', getRoles);
router.get('/usuarios', getUsuarios);
router.post('/usuarios', crearUsuario);
router.put('/usuarios/:id', editarUsuario);

router.patch('/usuarios/:id/estado', actualizarEstadoUsuario); 
router.delete('/usuarios/:id', eliminarUsuario); 

module.exports = router;