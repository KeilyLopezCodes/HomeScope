const placesService = require('../services/placesService')

const obtenerLugaresPorCategoria = async(req, res) => {
    try {
        console.log("Query recibida: ", req.query)
        const {category, lat, lng, radio, propiedadId} = req.query
        //valida los campos obligatorios 
        if(!category || !lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Faltan parámetros obligatorios: category, lat y lng son requeridos.'
            })
        }

        //convierte latitud y longitud a numeros flotantes
        const latitud = parseFloat(lat)
        const longitud = parseFloat(lng)

        if(isNaN(latitud) || isNaN(longitud)) {
            return res.status(400).json({
                success: false,
                message: 'Las coordenadas (lat y lng) deben ser valores numéricos válidos.'
            })
        }

        //radio de busqueda
        const radioBusqueda = radio ? parseInt(radio, 10) : 5000;

        //llamada al servicio
        const lugaresProcesados = await placesService.obtenerLugaresPorCategoria({
            category,
            lat: latitud,
            lng: longitud,
            radio: radioBusqueda,
            propiedadId
        })

        return res.status(200).json({
            success: true,
            message: 'Lugares consultados y puntos de interés persistidos exitosamente.',
            total: lugaresProcesados.length,
            data: lugaresProcesados
        })
    } catch (error){
        console.error('Error en placesController (obtenerLugaresPorCategoria):', error);
        return res.status(500).json({
            success:false,
            message: 'Ocurrió un error interno en el servidor al procesar los puntos de interés.',
            error: error.message
        })
    }
}

module.exports = {obtenerLugaresPorCategoria}