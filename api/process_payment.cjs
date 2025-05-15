// Este archivo no se necesita si usás <Payment /> directamente
module.exports = (req, res) => {
    return res.status(200).json({ message: 'Sin uso actual: se maneja todo desde Payment Brick' });
};
